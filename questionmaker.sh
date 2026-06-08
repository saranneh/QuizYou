#!/usr/bin/env bash

echo "=== Questions to JSON Converter ==="
echo

read -p "Enter the input .txt file: " INPUT_FILE
read -p "Enter the output filename (without .json): " OUTPUT_NAME

OUTPUT_FILE="${OUTPUT_NAME}.json"

if [[ ! -f "$INPUT_FILE" ]]; then
    echo "Error: '$INPUT_FILE' does not exist."
    exit 1
fi

echo "[" > "$OUTPUT_FILE"

first=true

IFS=',' read -ra questions < "$INPUT_FILE"

for q in "${questions[@]}"; do
    # Trim whitespace
    q=$(echo "$q" | sed 's/^ *//;s/ *$//')

    # Escape quotes for JSON
    q=$(printf '%s' "$q" | sed 's/"/\\"/g')

    if [ "$first" = true ]; then
        first=false
    else
        echo "," >> "$OUTPUT_FILE"
    fi

    printf '  {"question":"%s"}' "$q" >> "$OUTPUT_FILE"
done

echo "" >> "$OUTPUT_FILE"
echo "]" >> "$OUTPUT_FILE"

echo
echo "Successfully created: $OUTPUT_FILE"