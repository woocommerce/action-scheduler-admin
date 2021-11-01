#!/bin/bash
#
# Build the plugin zip

ZIP_NAME='action-scheduler-admin.zip'
SAVE_PATH=$(pwd)

# Switch to the root of the repository
cd $(dirname $(dirname $0))

# Remove existing archive
if [ -f $ZIP_NAME ]; then
  rm $ZIP_NAME
fi

# Build and zip
npm run build
zip -r action-scheduler-admin.zip ./ -x \
  ./\*.config.js \
  ./js\* \
  ./package\*.json \
  ./bin/\* \
  ./node_modules/\* \
  ./.git/\* \
  ./.\*

# Restore environment
cd $SAVE_PATH