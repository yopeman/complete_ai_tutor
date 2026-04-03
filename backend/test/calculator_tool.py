import math

def calculator(expression: str) -> float:
    """
    Calculate mathematical expressions.
    Useful for solving math problems, equations, and numerical computations.
    """
    # Safe evaluation
    allowed_names = {k: v for k, v in math.__dict__.items() if not k.startswith("__")}
    allowed_names.update({"abs": abs, "round": round})
    
    try:
        result = eval(expression, {"__builtins__": {}}, allowed_names)
        return float(result)
    except Exception as e:
        return f"Error: {str(e)}"