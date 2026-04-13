# FederGR Access Control Module Dockerfile
# 作者: GitHub Copilot

FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package files
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源文件
COPY src ./src
COPY tsconfig.json ./

# 编译 TypeScript
RUN npm run build

# 运行阶段
FROM node:18-alpine

WORKDIR /app

# 安装生产依赖
COPY package*.json ./
RUN npm ci --only=production

# 从构建阶段复制编译后的代码
COPY --from=builder /app/dist ./dist

# 暴露端口
EXPOSE 3003

# 环境变量
ENV NODE_ENV=production
ENV AC_SERVICE_PORT=3003
ENV AC_SERVICE_HOST=0.0.0.0

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# 启动应用
CMD ["node", "dist/index.js"]
