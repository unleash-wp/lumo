#!/bin/bash
# Convert all commands in .claude/commands/ckm/ to skills in .claude/skills/
set -euo pipefail

BASE="/Users/duynguyen/www/claudekit/claudekit-marketing"
CMD_DIR="$BASE/.claude/commands/ckm"
SKILL_DIR="$BASE/.claude/skills"

converted=0
skipped=0

find "$CMD_DIR" -name "*.md" -type f | sort | while IFS= read -r file; do
  rel="${file#$CMD_DIR/}"
  rel_noext="${rel%.md}"

  dir_name="ckm-$(echo "$rel_noext" | tr '/' '-')"
  skill_name="ckm:$(echo "$rel_noext" | tr '/' ':')"

  target_dir="$SKILL_DIR/$dir_name"
  target_file="$target_dir/SKILL.md"

  if [ -f "$target_file" ]; then
    echo "SKIP (exists): $dir_name"
    skipped=$((skipped + 1))
    continue
  fi

  mkdir -p "$target_dir"

  # Use awk to parse frontmatter and body
  first_line=$(head -1 "$file")

  if [ "$first_line" = "---" ]; then
    # Has YAML frontmatter
    desc=$(awk '/^---$/{c++; next} c==1 && /^description:/{sub(/^description: */, ""); print; exit}' "$file")
    arg_hint=$(awk '/^---$/{c++; next} c==1 && /^argument-hint:/{sub(/^argument-hint: */, ""); print; exit}' "$file")
    body=$(awk 'BEGIN{c=0} /^---$/{c++; next} c>=2{print}' "$file")

    # Build SKILL.md
    {
      echo "---"
      echo "name: $skill_name"
      echo "description: $desc"
      if [ -n "$arg_hint" ]; then
        echo "argument-hint: \"$arg_hint\""
      fi
      echo "metadata:"
      echo "  author: claudekit"
      echo "  version: \"1.0.0\""
      echo "---"
      echo "$body"
    } > "$target_file"
  else
    # No frontmatter
    desc_text=$(echo "$first_line" | sed 's/^# *//' | sed 's/^Command: *//')
    {
      echo "---"
      echo "name: $skill_name"
      echo "description: $desc_text"
      echo "metadata:"
      echo "  author: claudekit"
      echo "  version: \"1.0.0\""
      echo "---"
      echo ""
      cat "$file"
    } > "$target_file"
  fi

  echo "OK: $dir_name → $skill_name"
  converted=$((converted + 1))
done

echo ""
echo "Conversion complete."
