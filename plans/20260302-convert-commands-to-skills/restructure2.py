#!/usr/bin/env python3
"""Restructure commands into grouped skills with references."""
import os
import re
import shutil

SKILL_DIR = "/Users/duynguyen/www/claudekit/claudekit-marketing/.claude/skills"
CMD_DIR = "/Users/duynguyen/www/claudekit/claudekit-marketing/.claude/commands/ckm"

# Groups: parent -> [children]
GROUPS = {
    "analyze": ["report"],
    "brand": ["update"],
    "campaign": ["analyze", "create", "email", "status"],
    "dashboard": ["check"],
    "docs": ["init", "llms", "summarize", "update"],
    "email": ["flow", "sequence"],
    "plan": ["archive", "ci", "cro", "fast", "hard", "parallel", "two", "validate"],
    "seo": ["audit", "keywords", "pseo"],
    "skill": ["add", "create", "fix-logs", "optimize", "optimize-auto", "plan", "update"],
    "slides": ["create"],
    "social": ["schedule"],
    "storage": ["list", "sync", "upload", "url"],
    "test": ["ui", "workflow"],
    "video": ["create", "script-create", "storyboard-create"],
    "write": ["audit", "blog", "blog-youtube", "cro", "enhance", "fast", "formula", "good", "publish"],
    "youtube": ["blog", "infographic", "social"],
}

# Standalone skills (no subcommands)
STANDALONE = [
    "ask", "ck-help", "competitor", "funnel", "hub", "init",
    "journal", "kanban", "persona", "preview", "use-mcp", "watzup", "worktree"
]

# Map child names to their command file paths
# Most are simple: child "report" -> "analyze/report.md"
# Some are deeper: "script-create" -> "video/script/create.md"
# And "blog-youtube" -> "write/blog/youtube.md"
# And "optimize-auto" -> "skill/optimize/auto.md"
CHILD_PATH_MAP = {
    # video group
    ("video", "script-create"): "video/script/create.md",
    ("video", "storyboard-create"): "video/storyboard/create.md",
    # write group
    ("write", "blog-youtube"): "write/blog/youtube.md",
    # skill group
    ("skill", "optimize-auto"): "skill/optimize/auto.md",
}


def parse_frontmatter(content):
    """Parse YAML frontmatter and body from markdown."""
    if not content.startswith("---"):
        return {}, content

    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}, content

    fm_text = parts[1].strip()
    body = parts[2].strip()

    # Simple YAML parsing
    fm = {}
    for line in fm_text.split("\n"):
        if ":" in line and not line.startswith(" "):
            key, val = line.split(":", 1)
            fm[key.strip()] = val.strip().strip('"').strip("'")

    return fm, body


def get_cmd_file(parent, child=None):
    """Get command file path."""
    if child is None:
        return os.path.join(CMD_DIR, f"{parent}.md")

    # Check special path mappings
    key = (parent, child)
    if key in CHILD_PATH_MAP:
        return os.path.join(CMD_DIR, CHILD_PATH_MAP[key])

    # Default: parent/child.md
    return os.path.join(CMD_DIR, parent, f"{child}.md")


def read_cmd(filepath):
    """Read a command file and return (frontmatter_dict, body_text)."""
    if not os.path.exists(filepath):
        return {}, ""
    with open(filepath, "r") as f:
        content = f.read()
    return parse_frontmatter(content)


def build_skill_md(name, description, arg_hint, body, children_table="", routing=""):
    """Build a SKILL.md content string."""
    lines = ["---"]
    lines.append(f"name: ckm:{name}")
    lines.append(f"description: {description}")
    if arg_hint:
        lines.append(f'argument-hint: "{arg_hint}"')
    lines.append("metadata:")
    lines.append("  author: claudekit")
    lines.append('  version: "1.0.0"')
    lines.append("---")
    lines.append("")
    if body:
        lines.append(body)
        lines.append("")
    if children_table:
        lines.append(children_table)
        lines.append("")
    if routing:
        lines.append(routing)
    return "\n".join(lines)


def process_group(parent, children):
    """Create a grouped skill with references."""
    # Determine target directory
    # storage/ conflicts with existing skill
    if parent == "storage":
        target_dir = os.path.join(SKILL_DIR, "ckm-storage")
    else:
        target_dir = os.path.join(SKILL_DIR, parent)

    refs_dir = os.path.join(target_dir, "references")
    os.makedirs(refs_dir, exist_ok=True)

    # Read parent command (if exists)
    parent_fm, parent_body = read_cmd(get_cmd_file(parent))
    parent_desc = parent_fm.get("description", f"{parent.capitalize()} commands")
    parent_hint = parent_fm.get("argument-hint", "[subcommand] [args]")

    # Build children table and references
    table_lines = ["## Subcommands", "",
                   "| Subcommand | Description | Reference |",
                   "|------------|-------------|-----------|"]

    for child in children:
        child_fm, child_body = read_cmd(get_cmd_file(parent, child))
        child_desc = child_fm.get("description", child)

        # Reference filename: use child name directly
        ref_name = f"{child}.md"
        table_lines.append(f"| `{child}` | {child_desc} | `references/{ref_name}` |")

        # Write reference file (body content of the child command)
        ref_path = os.path.join(refs_dir, ref_name)
        with open(ref_path, "w") as f:
            f.write(child_body + "\n")

    children_table = "\n".join(table_lines)

    routing = """## Routing

1. Parse subcommand from `$ARGUMENTS` (first word)
2. Load corresponding `references/{subcommand}.md`
3. Execute with remaining arguments"""

    # Build and write SKILL.md
    skill_content = build_skill_md(parent, parent_desc, parent_hint,
                                   parent_body, children_table, routing)
    skill_path = os.path.join(target_dir, "SKILL.md")
    with open(skill_path, "w") as f:
        f.write(skill_content)

    print(f"GROUP: {parent}/ → {os.path.basename(target_dir)}/ ({len(children)} references)")


def process_standalone(name):
    """Create a standalone skill (no subcommands)."""
    target_dir = os.path.join(SKILL_DIR, name)

    # Skip if already exists (from previous run)
    skill_path = os.path.join(target_dir, "SKILL.md")
    if os.path.exists(skill_path):
        # Re-read from command source to ensure correct content
        pass

    os.makedirs(target_dir, exist_ok=True)

    fm, body = read_cmd(get_cmd_file(name))
    desc = fm.get("description", name)
    hint = fm.get("argument-hint", "")

    skill_content = build_skill_md(name, desc, hint, body)
    with open(skill_path, "w") as f:
        f.write(skill_content)

    print(f"STANDALONE: {name}/")


def main():
    # Process groups
    for parent, children in sorted(GROUPS.items()):
        process_group(parent, children)

    # Process standalone
    for name in sorted(STANDALONE):
        process_standalone(name)

    # Summary
    total_refs = sum(len(c) for c in GROUPS.values())
    print(f"\nDone: {len(GROUPS)} groups ({total_refs} references) + {len(STANDALONE)} standalone = {len(GROUPS) + len(STANDALONE)} skill dirs")


if __name__ == "__main__":
    main()
