import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = [
  { ignores: ['public/smarteditor2/**'] },
  ...nextVitals,
]

export default eslintConfig
