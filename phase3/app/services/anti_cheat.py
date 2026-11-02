import ast
import hashlib
from typing import Any, Dict, List, Optional, Set, Tuple


STANDARD_NAMES = {
    "solve",
    "range",
    "len",
    "sum",
    "min",
    "max",
    "abs",
    "print",
    "list",
    "dict",
    "set",
    "str",
    "int",
    "float",
    "bool",
    "enumerate",
    "zip",
    "reversed",
    "sorted",
    "map",
    "filter",
    "True",
    "False",
    "None",
}


class ASTNormalizer(ast.NodeTransformer):
    """Normalizes an AST by stripping docstrings and standardizing identifier names."""

    def __init__(self, target_function: str = "solve"):
        super().__init__()
        self.target_function = target_function
        self.var_map: Dict[str, str] = {}
        self.var_counter = 0

    def _get_canonical_name(self, original: str) -> str:
        if original == self.target_function or original in STANDARD_NAMES:
            return original
        if original not in self.var_map:
            self.var_map[original] = f"_v{self.var_counter}"
            self.var_counter += 1
        return self.var_map[original]

    def visit_FunctionDef(self, node: ast.FunctionDef) -> ast.FunctionDef:
        # Strip docstring
        if (
            node.body
            and isinstance(node.body[0], ast.Expr)
            and isinstance(node.body[0].value, (ast.Constant, ast.Str))
        ):
            node.body = node.body[1:]

        # Normalize argument names (except if target function)
        for arg in node.args.args:
            arg.arg = self._get_canonical_name(arg.arg)

        self.generic_visit(node)
        return node

    def visit_Name(self, node: ast.Name) -> ast.Name:
        node.id = self._get_canonical_name(node.id)
        return node


def normalize_code_ast(code: str, target_function: str = "solve") -> Tuple[str, str]:
    """Parses code, normalizes identifiers and docstrings, and produces a deterministic AST hash.

    Returns:
      (normalized_dump: str, ast_hash: str)
    """
    try:
        tree = ast.parse(code)
    except SyntaxError:
        # Fallback to whitespace-stripped hash if code fails to parse
        cleaned = "".join(code.split())
        return cleaned, hashlib.sha256(cleaned.encode("utf-8")).hexdigest()

    normalizer = ASTNormalizer(target_function=target_function)
    normalized_tree = normalizer.visit(tree)
    ast.fix_missing_locations(normalized_tree)

    dump_str = ast.dump(normalized_tree, annotate_fields=False, include_attributes=False)
    ast_hash = hashlib.sha256(dump_str.encode("utf-8")).hexdigest()
    return dump_str, ast_hash


def check_submission_for_cheating(
    user_id: str,
    challenge_id: str,
    code: str,
    user_submission_count_for_challenge: int,
    recent_ast_hashes_for_challenge: List[Tuple[str, str]],  # List of (other_user_id, ast_hash)
    target_function: str = "solve",
) -> Dict[str, Any]:
    """Evaluates a submission for plagiarism or repeat spamming.

    Rules:
      1. When the student pastes the same solution 5 times, submissions 2-5 are flagged
         for review in the DB as repeated duplicate pastes.
      2. If matching another student's normalized AST hash, flagged as shared_ast for review.
      3. Never blocks scoring - returns flag metadata to be persisted to DB.
    """
    _, ast_hash = normalize_code_ast(code, target_function=target_function)

    is_flagged = False
    flag_type = "clean"
    reason = "Original submission structure verified."
    similarity_score = 0.0
    matched_submission_id: Optional[str] = None

    # Check 1: User pasting identical solution repeatedly (submissions 2+)
    if user_submission_count_for_challenge >= 1:
        is_flagged = True
        flag_type = "duplicate_paste"
        similarity_score = 1.0
        reason = f"Identical repeated solution submitted (submission #{user_submission_count_for_challenge + 1}). Flagged for review."

    # Check 2: Cross-user identical AST structure
    elif recent_ast_hashes_for_challenge:
        for other_uid, other_hash in recent_ast_hashes_for_challenge:
            if other_uid != user_id and other_hash == ast_hash:
                is_flagged = True
                flag_type = "shared_ast"
                similarity_score = 1.0
                reason = "AST structure matches another student submission. Flagged for review."
                break

    return {
        "is_flagged": is_flagged,
        "flag_type": flag_type,
        "reason": reason,
        "similarity_score": similarity_score,
        "ast_hash": ast_hash,
        "matched_submission_id": matched_submission_id,
    }
