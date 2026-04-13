# FederGR API Gateway Dockerfile
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
EXPOSE 8000

# 环境变量
ENV NODE_ENV=production
ENV GATEWAY_PORT=8000
ENV GATEWAY_HOST=0.0.0.0
ENV LOG_LEVEL=info

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/gateway/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# 启动应用
CMD ["node", "dist/index.ts"]
