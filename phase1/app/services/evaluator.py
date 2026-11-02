import ast
from typing import Any, Dict, List, Tuple


def evaluate_logic(code: str, spec: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """Evaluates Python code against an AST-based static specification.

    Supported spec keys:
      - required_function: str
      - min_args: int (used with required_function)
      - max_args: int (used with required_function)
      - require_nodes: list[str]
      - forbid_builtins: list[str]
      - max_complexity: int

    Returns:
      (ok: bool, notes: list[str])
    """
    notes: List[str] = []

    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return False, [f"SyntaxError on line {e.lineno}: {e.msg}"]

    # 1. required_function & arg bounds
    required_func = spec.get("required_function")
    if required_func:
        func_node = None
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) and node.name == required_func:
                func_node = node
                break

        if not func_node:
            notes.append(f"Missing required function definition '{required_func}'.")
        else:
            args_count = len(func_node.args.args)
            min_args = spec.get("min_args")
            max_args = spec.get("max_args")

            if min_args is not None and args_count < min_args:
                notes.append(
                    f"Function '{required_func}' accepts {args_count} arguments, expected at least {min_args}."
                )
            if max_args is not None and args_count > max_args:
                notes.append(
                    f"Function '{required_func}' accepts {args_count} arguments, expected at most {max_args}."
                )

    # 2. require_nodes
    require_nodes = spec.get("require_nodes", [])
    if require_nodes:
        found_node_types = {type(node).__name__ for node in ast.walk(tree)}
        for req in require_nodes:
            if req not in found_node_types:
                notes.append(f"Code does not contain required syntax structure '{req}'.")

    # 3. forbid_builtins
    forbid_builtins = spec.get("forbid_builtins", [])
    if forbid_builtins:
        forbid_set = set(forbid_builtins)
        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                if node.func.id in forbid_set:
                    notes.append(
                        f"Usage of forbidden builtin function '{node.func.id}' is not allowed."
                    )

    # 4. max_complexity
    max_complexity = spec.get("max_complexity")
    if max_complexity is not None:
        complexity_nodes = (ast.If, ast.For, ast.While, ast.BoolOp, ast.Try)
        complexity_score = sum(
            1 for node in ast.walk(tree) if isinstance(node, complexity_nodes)
        )
        if complexity_score > max_complexity:
            notes.append(
                f"Cyclomatic complexity ({complexity_score}) exceeds maximum allowed ({max_complexity})."
            )

    is_ok = len(notes) == 0
    return is_ok, notes
