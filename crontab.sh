#!/bin/bash

DISPLAY=:0 gnome-terminal -x bash -c "npm run download-doge && npm run download-btc && npm run download-eth && npm run pdf-year 2022 && npm run publish && exit"
