# 对单个包：升级版本 + 构建 + 发布（全流程）
bun run release --package tsone --bump minor
bun run release --package one --bump patch
bun run release --package tsone-cli --bump major

# 也可以分别执行单一操作（可任意组合）
bun run release --package tsone --build            # 仅构建
bun run release --package tsone-cli --publish      # 仅发布（会自动补构建）
bun run release --package tsone --bump minor --dry-run   # 演练，不落盘不发布