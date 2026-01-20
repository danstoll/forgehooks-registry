# Math Service ForgeHook

Advanced mathematical operations including arithmetic, statistics, matrix operations, equation solving, and numerical analysis.

## Features

- **Expression Evaluation** - Parse and evaluate mathematical expressions with variable support
- **Statistics** - Calculate mean, median, standard deviation, variance, and more
- **Matrix Operations** - Multiply, inverse, determinant, eigenvalues
- **Equation Solving** - Solve single equations and systems of equations
- **Calculus** - Symbolic derivatives and integrals

## Installation

### From FlowForge Marketplace

Search for "Math Service" in the marketplace.

### From GitHub

```text
danstoll/forgehooks-registry/plugins/math-service
```

### From Package

Download the `.fhk` package from releases.

## API Endpoints

| Endpoint      | Method | Description                       |
| ------------- | ------ | --------------------------------- |
| `/calculate`  | POST   | Evaluate mathematical expressions |
| `/statistics` | POST   | Calculate statistics on datasets  |
| `/matrix`     | POST   | Matrix operations                 |
| `/solve`      | POST   | Solve equations                   |
| `/derivative` | POST   | Calculate derivatives             |
| `/integral`   | POST   | Calculate integrals               |
| `/health`     | GET    | Health check                      |

## Examples

### Calculate Expression

```bash
curl -X POST http://localhost:5001/api/v1/math/calculate \
  -H "Content-Type: application/json" \
  -d '{"expression": "2 + 2 * 3"}'
```

### Statistics

```bash
curl -X POST http://localhost:5001/api/v1/math/statistics \
  -H "Content-Type: application/json" \
  -d '{"data": [1, 2, 3, 4, 5], "operations": ["mean", "std"]}'
```

### Matrix Multiplication

```bash
curl -X POST http://localhost:5001/api/v1/math/matrix \
  -H "Content-Type: application/json" \
  -d '{"operation": "multiply", "matrix_a": [[1,2],[3,4]], "matrix_b": [[5,6],[7,8]]}'
```

## Configuration

| Variable               | Description             | Default |
| ---------------------- | ----------------------- | ------- |
| `LOG_LEVEL`            | Logging verbosity       | `info`  |
| `MAX_COMPUTATION_TIME` | Max computation seconds | `30`    |

## License

MIT
