#!/usr/bin/env python3
import json
import sys
from pathlib import Path

import onnx
from TTS.config import load_config
from TTS.tts.models.vits import Vits

ROOT = Path(__file__).resolve().parents[3]
CANDIDATES = ROOT / "apps/mobile/tts-candidates"
OUTPUTS = ROOT / "apps/mobile/tts-converted"

MODELS = {
    "kamtera-female": {
        "checkpoint": CANDIDATES / "kamtera-female/best_model_30824.pth",
        "config": CANDIDATES / "kamtera-female/config.json",
        "output": OUTPUTS / "kamtera-female",
    },
    "kamtera-male": {
        "checkpoint": CANDIDATES / "kamtera-male/best_model_91323.pth",
        "config": CANDIDATES / "kamtera-male/config.json",
        "output": OUTPUTS / "kamtera-male",
    },
}


def fail(message: str) -> None:
    print(f"KAMTERA CONVERSION FAILED: {message}", file=sys.stderr)
    raise SystemExit(1)


def add_metadata(filename: Path, values: dict) -> None:
    model = onnx.load(str(filename))
    existing = {item.key: item.value for item in model.metadata_props}
    for key, value in values.items():
        existing[str(key)] = str(value)
    del model.metadata_props[:]
    for key, value in existing.items():
        prop = model.metadata_props.add()
        prop.key = key
        prop.value = value
    onnx.save(model, str(filename))


def convert(name: str, spec: dict) -> None:
    checkpoint = spec["checkpoint"]
    config_path = spec["config"]
    output_dir = spec["output"]
    if not checkpoint.exists():
        fail(f"missing checkpoint: {checkpoint}")
    if not config_path.exists():
        fail(f"missing config: {config_path}")

    output_dir.mkdir(parents=True, exist_ok=True)
    output_model = output_dir / "model.onnx"
    output_tokens = output_dir / "tokens.txt"

    config = load_config(str(config_path))
    vits = Vits.init_from_config(config)
    vits.load_checkpoint(config, str(checkpoint), eval=True)
    vits.eval()

    if not output_model.exists():
        print(f"[MYPA] Exporting {name} -> {output_model}")
        vits.export_onnx(output_path=str(output_model), verbose=False)

    characters = getattr(getattr(vits, "tokenizer", None), "characters", None)
    char_to_id = getattr(characters, "_char_to_id", None)
    if not char_to_id:
        fail(f"{name}: could not read tokenizer character map")

    with output_tokens.open("w", encoding="utf-8") as handle:
        for token, idx in char_to_id.items():
            handle.write(f"{token} {idx}\n")
            if (
                token not in ("<PAD>", "<EOS>", "BOS", "<BLNK>")
                and token.lower() != token.upper()
                and len(token.upper()) == 1
            ):
                handle.write(f"{token.upper()} {idx}\n")

    sample_rate = int(vits.ap.sample_rate)
    add_metadata(
        output_model,
        {
            "model_type": "vits",
            "comment": "coqui",
            "language": "Persian",
            "frontend": "characters",
            "add_blank": int(vits.config.add_blank),
            "blank_id": vits.tokenizer.characters.blank_id,
            "n_speakers": int(vits.config.model_args.num_speakers),
            "use_eos_bos": int(vits.tokenizer.use_eos_bos),
            "bos_id": vits.tokenizer.characters.bos_id,
            "eos_id": vits.tokenizer.characters.eos_id,
            "pad_id": vits.tokenizer.characters.pad_id,
            "sample_rate": sample_rate,
        },
    )

    if output_model.stat().st_size < 10_000_000:
        fail(f"{name}: exported model is unexpectedly small")
    if output_tokens.stat().st_size < 100:
        fail(f"{name}: tokens.txt is unexpectedly small")

    print(json.dumps({
        "model": str(output_model),
        "modelBytes": output_model.stat().st_size,
        "tokensBytes": output_tokens.stat().st_size,
        "sampleRate": sample_rate,
    }))


for model_name, model_spec in MODELS.items():
    convert(model_name, model_spec)

print("KAMTERA CONVERSION PASS")
