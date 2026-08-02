import js from "@eslint/js";
import globals from "globals";

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.browser
            },
            ecmaVersion: "latest",
            sourceType: "module"
        },
        rules: {
            "no-unused-vars": "warn"
        }
    }
];