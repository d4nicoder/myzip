# Changelog
All notable changes to this project will be documented in this file

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2020-04-06
### Changed:
- Refactorized code into Typescript

## [0.3.1] - 2019-07-06
### Changed:
- README.md updated
- Added keywords to package.json


## [0.3.0] - 2019-07-06
### Added:
- Method extract. Now is possible to extract zip files to destination folder

### Changed:
- example.js now creates a zip file and extract to a test folder

## [0.2.0] - 2019-07-05
### Added:
- If the source folder to add ends with a slash '/', it will add all the contents in the destination folder inside the zip without create that folder in the zip file

### Fixed:
- pipe method was broke. Now it's fixed.