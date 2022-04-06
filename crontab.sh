#!/bin/bash

LOG="/tmp/doge-cal.log"
DISPLAY=:0 gnome-terminal -x bash -c "npm run download-doge >> $LOG 2>&1 && npm run download-btc >> $LOG 2>&1 && npm run download-eth >> $LOG 2>&1 && npm run pdf-year 2022 >> $LOG 2>&1 && npm run publish >> $LOG 2>&1 && exit"
