@echo off
if exist .\schema rmdir .\schema /s /q
mkdir .\schema
cd .\schema
call appwrite init project
call appwrite init collection
call appwrite init bucket
