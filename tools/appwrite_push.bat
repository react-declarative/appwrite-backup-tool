@echo off
if not exist .\schema mkdir schema
cd .\schema
call appwrite deploy collection
