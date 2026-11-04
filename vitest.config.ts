import { configDefaults, defineConfig } from "vitest/config";

// .claude/ 아래 설치한 스킬의 자체 테스트(node:test)는 이 프로젝트 테스트가 아니다
export default defineConfig({
  test: { exclude: [...configDefaults.exclude, ".claude/**"] },
});
