import js from "@eslint/js";
import globals from "globals";

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.node
            },
            ecmaVersion: "latest",
            sourceType: "commonjs"
        },
        rules: {
            "no-unused-vars": "warn",
            "no-console": "off"
        }
    }
];