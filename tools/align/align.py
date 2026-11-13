"""Free word timings for a SCRIPTED voiceover: forced alignment of the known text to the audio.

Used instead of paid speech-to-text when the exact words are already known (a TTS/ElevenLabs voiceover made
from a script): the words come from the script, only their times come from the audio. Spelling on screen is
therefore exactly the script's. Works for Hindi, Telugu, English and code-mixed text.

Model: Meta's MMS forced-alignment model via torchaudio (torchaudio.pipelines.MMS_FA, CPU, ~1.2 GB download on
first use, cached in ~/.cache/torch/hub). Every word is romanised with uroman, because MMS_FA's vocabulary is
Latin letters; the timing then maps back to the original word.

Usage: python tools/align/align.py <audio> <script.txt> <out.json>
Writes {"engine", "language_code", "words": [{"text", "start", "end", "type": "word", "align_score"}]} — the shape
tools/transcribe.mjs reads from its other engines.
"""
import argparse
import json
import re
import subprocess
import sys

SR = 16000
CHUNK_S = 30  # emission in chunks: bounded memory on a 7 GB runner, any audio length


def decode(path):
    """Audio → mono 16 kHz float32 via ffmpeg (handles m4a/mp3/wav alike)."""
    import numpy as np

    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def tokens_of(text):
    """Script words (as written) with their romanised form; punctuation-only tokens join the previous word."""
    import uroman as ur

    roman = ur.Uroman()
    words = []
    for tok in text.split():
        r = roman.romanize_string(tok).lower()
        r = re.sub(r"[^a-z']", "", r)
        if r:
            words.append({"text": tok, "roman": r})
        elif words:
            words[-1]["text"] += tok if re.fullmatch(r"\W+", tok) else " " + tok
    return words


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("script")
    ap.add_argument("out")
    ap.add_argument("--language", default="hin")
    args = ap.parse_args()

    import torch
    from torchaudio.pipelines import MMS_FA as bundle

    text = open(args.script, encoding="utf8").read().replace("﻿", "")
    words = tokens_of(text)
    if not words:
        sys.exit("error: the script has no alignable words")

    wav = torch.from_numpy(decode(args.audio))
    if wav.numel() < SR:
        sys.exit("error: the audio is shorter than one second")

    torch.set_num_threads(max(1, torch.get_num_threads()))
    model = bundle.get_model()
    model.eval()
    chunks = []
    step = CHUNK_S * SR
    with torch.inference_mode():
        for i in range(0, wav.numel(), step):
            part = wav[i:i + step]
            if part.numel() < 400:  # a few ms tail: below the model's receptive field
                continue
            emission, _ = model(part.unsqueeze(0))
            chunks.append(emission[0])
    emission = torch.cat(chunks)
    frame_s = wav.numel() / SR / emission.size(0)

    tokenizer = bundle.get_tokenizer()
    aligner = bundle.get_aligner()
    spans = aligner(emission, tokenizer([w["roman"] for w in words]))

    out = []
    for w, sp in zip(words, spans):
        score = sum(s.score * len(s) for s in sp) / max(1, sum(len(s) for s in sp))
        out.append({
            "text": w["text"],
            "start": round(sp[0].start * frame_s, 3),
            "end": round(sp[-1].end * frame_s, 3),
            "type": "word",
            # no "logprob": an alignment score is not ASR confidence, and transcript.md would flag clean words
            "align_score": round(score, 3),
        })
    result = {
        "engine": "mms forced alignment (script)",
        "language_code": args.language,
        "language_probability": None,
        "words": out,
    }
    with open(args.out, "w", encoding="utf8") as fh:
        json.dump(result, fh, ensure_ascii=False, indent=1)
    low = sum(1 for w in out if w["align_score"] < 0.1)
    print(f"aligned {len(out)} words over {wav.numel() / SR:.1f}s ({low} with low confidence)")


if __name__ == "__main__":
    main()
