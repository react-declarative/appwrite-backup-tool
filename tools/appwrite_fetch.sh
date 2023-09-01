#!/usr/bin/env bash
mkdir -p schema
cd ./schema
rm appwrite.json
appwrite init project
appwrite init collection
appwrite init bucket
