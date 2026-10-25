# ---- Stage 1: Build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# ---- Stage 2: Runtime ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
RUN npm install --omit=dev --legacy-peer-deps express
# Create a minimal static server
RUN printf 'const express=require("express");const path=require("path");const app=express();app.use(express.static(path.join(__dirname,"dist")));app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"dist","index.html")));app.listen(process.env.PORT||3000,process.env.HOST||"0.0.0.0",()=>console.log("listening on "+(process.env.PORT||3000)));' > server.cjs
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1:3000/ >/dev/null 2>&1 || exit 1
CMD ["node", "server.cjs"]
