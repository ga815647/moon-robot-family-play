"""Package only validated plugin files; deterministic ZIP, no runtime dependencies."""
import json
import subprocess
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

root = Path(__file__).resolve().parent.parent
subprocess.run(["node", str(root / "scripts/build-plugin.mjs"), "--check"], cwd=root, check=True)
plugin = root / "plugins/moon-robot-family-play"
manifest = json.loads((plugin / "plugin.json").read_text(encoding="utf-8"))
output = root / ".local" / f"{manifest['name']}-{manifest['version']}.zip"
output.parent.mkdir(exist_ok=True)
expected = []
with ZipFile(output, "w", compression=ZIP_DEFLATED) as archive:
    for source in sorted(plugin.rglob("*")):
        if source.is_symlink():
            raise ValueError("Symlinks are not permitted")
        if not source.is_file():
            continue
        relative = source.relative_to(plugin).as_posix()
        expected.append(relative)
        info = ZipInfo(relative, date_time=(1980, 1, 1, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        # Normalize text for identical source hashes on Windows and Unix.
        archive.writestr(info, source.read_text(encoding="utf-8").replace("\r\n", "\n").encode("utf-8"))

with ZipFile(output) as archive:
    assert archive.testzip() is None
    assert sorted(archive.namelist()) == sorted(expected)
    assert "plugin.json" in archive.namelist() and "mcp.json" in archive.namelist()
    assert sum(name.endswith("/SKILL.md") for name in archive.namelist()) == 4
    release = json.loads(archive.read("release.json"))
    import hashlib
    for name, expected_hash in release["files_sha256"].items():
        assert hashlib.sha256(archive.read(name)).hexdigest() == expected_hash, name
print(json.dumps({"archive": str(output), "files": len(expected), "skills": 4, "version": manifest["version"], "status": "inspected"}))
