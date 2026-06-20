#!/bin/bash
# Restructure ckm-* skills: remove prefix, group with references
set -euo pipefail

SKILL_DIR="/Users/duynguyen/www/claudekit/claudekit-marketing/.claude/skills"
cd "$SKILL_DIR"

# ============================================================
# PHASE 1: Define groups and standalone skills
# ============================================================

# Groups: "parent_dir:child1,child2,child3"
# For groups WITH a parent command, parent content goes into SKILL.md
# Children become references/

declare -a GROUPS=(
  "analyze:report"
  "brand:update"
  "campaign:analyze,create,email,status"
  "dashboard:check"
  "docs:init,llms,summarize,update"
  "email:flow,sequence"
  "plan:archive,ci,cro,fast,hard,parallel,two,validate"
  "seo:audit,keywords,pseo"
  "skill:add,create,fix-logs,optimize,optimize-auto,plan,update"
  "slides:create"
  "social:schedule"
  "storage:list,sync,upload,url"
  "test:ui,workflow"
  "video:create,script-create,storyboard-create"
  "write:audit,blog,blog-youtube,cro,enhance,fast,formula,good,publish"
  "youtube:blog,infographic,social"
)

# Standalone skills (no subcommands)
declare -a STANDALONE=(
  "ask"
  "ck-help"
  "competitor"
  "funnel"
  "hub"
  "init"
  "journal"
  "kanban"
  "persona"
  "preview"
  "use-mcp"
  "watzup"
  "worktree"
)

# ============================================================
# PHASE 2: Create grouped skills
# ============================================================

for group_def in "${GROUPS[@]}"; do
  parent="${group_def%%:*}"
  children_str="${group_def#*:}"
  IFS=',' read -ra children <<< "$children_str"

  # Handle storage conflict - use "ckm-storage" to avoid conflict
  if [ "$parent" = "storage" ]; then
    new_dir="ckm-storage"
  else
    new_dir="$parent"
  fi

  echo "GROUP: $parent → $new_dir/ (${#children[@]} references)"

  # Create new directory with references
  mkdir -p "$new_dir/references"

  # Check if parent skill exists (ckm-{parent}/SKILL.md)
  parent_src="ckm-$parent/SKILL.md"
  if [ -f "$parent_src" ]; then
    # Parent exists - extract body (after frontmatter)
    parent_body=$(awk 'BEGIN{c=0} /^---$/{c++; next} c>=2{print}' "$parent_src")
    parent_desc=$(awk '/^---$/{c++; next} c==1 && /^description:/{sub(/^description: */, ""); print; exit}' "$parent_src")
    parent_hint=$(awk '/^---$/{c++; next} c==1 && /^argument-hint:/{sub(/^argument-hint: */, ""); gsub(/"/, ""); print; exit}' "$parent_src")
  else
    # No parent - create router description
    parent_body=""
    # Get description from first child
    first_child="${children[0]}"
    parent_desc="$(echo "$parent" | sed 's/.*/\u&/') commands"
    parent_hint="[subcommand] [args]"
  fi

  # Build references table
  ref_table="## Subcommands\n\n| Subcommand | Description | Reference |\n|------------|-------------|-----------|\n"
  for child in "${children[@]}"; do
    child_src="ckm-${parent}-${child}/SKILL.md"
    if [ -f "$child_src" ]; then
      child_desc=$(awk '/^---$/{c++; next} c==1 && /^description:/{sub(/^description: */, ""); print; exit}' "$child_src")
      ref_table+="| \`$child\` | $child_desc | \`references/$child.md\` |\n"

      # Extract child body and write to reference
      child_body=$(awk 'BEGIN{c=0} /^---$/{c++; next} c>=2{print}' "$child_src")
      echo "$child_body" > "$new_dir/references/$child.md"
    fi
  done

  # Build the parent SKILL.md
  {
    echo "---"
    echo "name: ckm:$parent"
    echo "description: $parent_desc"
    if [ -n "$parent_hint" ]; then
      echo "argument-hint: \"$parent_hint\""
    fi
    echo "metadata:"
    echo "  author: claudekit"
    echo "  version: \"1.0.0\""
    echo "---"
    echo ""
    if [ -n "$parent_body" ]; then
      echo "$parent_body"
      echo ""
    fi
    echo -e "$ref_table"
    echo ""
    echo "## Routing"
    echo ""
    echo "1. Parse subcommand from \`\$ARGUMENTS\` (first word)"
    echo "2. Load corresponding \`references/{subcommand}.md\`"
    echo "3. Execute with remaining arguments"
  } > "$new_dir/SKILL.md"

  echo "  Created $new_dir/SKILL.md + ${#children[@]} references"
done

# ============================================================
# PHASE 3: Create standalone skills (just rename)
# ============================================================

for name in "${STANDALONE[@]}"; do
  src="ckm-$name"
  if [ -d "$src" ]; then
    echo "STANDALONE: $src → $name/"
    # Simply move/copy
    mkdir -p "$name"
    cp "$src/SKILL.md" "$name/SKILL.md"
    echo "  Copied $name/SKILL.md"
  fi
done

# ============================================================
# PHASE 4: Delete old ckm-* directories
# ============================================================

echo ""
echo "Removing old ckm-* directories..."
rm -rf ckm-*/
echo "Done."

# ============================================================
# PHASE 5: Summary
# ============================================================

echo ""
echo "=== Summary ==="
echo "Groups created: ${#GROUPS[@]}"
echo "Standalone created: ${#STANDALONE[@]}"
echo "Total new skill dirs: $((${#GROUPS[@]} + ${#STANDALONE[@]}))"
echo ""
echo "New directories:"
ls -d analyze/ brand/ campaign/ dashboard/ docs/ email/ plan/ seo/ skill/ slides/ social/ ckm-storage/ test/ video/ write/ youtube/ ask/ ck-help/ competitor/ funnel/ hub/ init/ journal/ kanban/ persona/ preview/ use-mcp/ watzup/ worktree/ 2>/dev/null | sort
