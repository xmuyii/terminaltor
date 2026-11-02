import ast
from typing import Any, Dict, List, Set, Tuple


def evaluate_logic_depth(code: str, spec: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """Evaluates Python code against an advanced AST static evaluation specification.

    Supported spec keys:
      - required_function: str
      - min_args: int
      - max_args: int
      - require_nodes: list[str] (e.g. ["Return", "For"])
      - forbid_nodes: list[str] (e.g. ["While", "Import", "ImportFrom"])
      - forbid_builtins: list[str]
      - forbid_calls: list[str] (e.g. ["eval", "exec", "open", "sort"])
      - require_recursion: bool (checks if required_function calls itself)
      - max_complexity: int
      - max_nodes: int

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
    func_node: ast.FunctionDef | None = None
    if required_func:
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

    # 3. forbid_nodes
    forbid_nodes = spec.get("forbid_nodes", [])
    if forbid_nodes:
        found_node_types = {type(node).__name__ for node in ast.walk(tree)}
        for forbidden in forbid_nodes:
            if forbidden in found_node_types:
                notes.append(f"Forbidden syntax structure '{forbidden}' detected in code.")

    # 4. forbid_builtins and forbid_calls
    forbid_builtins = set(spec.get("forbid_builtins", []))
    forbid_calls = set(spec.get("forbid_calls", []))
    all_forbidden_calls = forbid_builtins.union(forbid_calls)

    if all_forbidden_calls:
        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                call_name = None
                if isinstance(node.func, ast.Name):
                    call_name = node.func.id
                elif isinstance(node.func, ast.Attribute):
                    call_name = node.func.attr

                if call_name and call_name in all_forbidden_calls:
                    notes.append(f"Usage of forbidden function or method '{call_name}' is not allowed.")

    # 5. require_recursion
    if spec.get("require_recursion") and func_node and required_func:
        has_recursive_call = False
        for node in ast.walk(func_node):
            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name) and node.func.id == required_func:
                    has_recursive_call = True
                    break
        if not has_recursive_call:
            notes.append(f"Function '{required_func}' must be implemented recursively.")

    # 6. max_complexity
    max_complexity = spec.get("max_complexity")
    if max_complexity is not None:
        complexity_nodes = (
            ast.If,
            ast.For,
            ast.While,
            ast.BoolOp,
            ast.Try,
            ast.ExceptHandler,
            ast.IfExp,
            ast.With,
        )
        complexity_score = sum(1 for node in ast.walk(tree) if isinstance(node, complexity_nodes))
        if complexity_score > max_complexity:
            notes.append(
                f"Cyclomatic complexity ({complexity_score}) exceeds maximum allowed ({max_complexity})."
            )

    # 7. max_nodes
    max_nodes = spec.get("max_nodes")
    if max_nodes is not None:
        total_nodes = sum(1 for _ in ast.walk(tree))
        if total_nodes > max_nodes:
            notes.append(f"Total AST node count ({total_nodes}) exceeds maximum allowed ({max_nodes}).")

    return (len(notes) == 0, notes)
