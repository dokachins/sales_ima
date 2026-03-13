#!/bin/bash
# デュアルレビュー: Codex → Claude Code の順で未コミット変更をレビュー

set -e
cd "$(dirname "$0")/.."

echo "======================================"
echo "  Codex レビュー"
echo "======================================"
codex review --uncommitted

echo ""
echo "======================================"
echo "  Claude Code レビューはターミナルで:"
echo "  git diff を貼り付けてレビュー依頼"
echo "======================================"
