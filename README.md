# dogecoin-lunar-calendar
This is the software suite used to create the [Dogecoin Lunar Calendar](https://dogecoincalendar.com) plus source for the website. I have worked to publish this software open source and I hope you can support my work with one [captcha plus $10](https://dogecoincalendar.com/solve). This software well demonstrates how to work programmatically with Coinbase to transact in Dogecoin, Bitcoin, and Ethereum. See also [dogecoin-lunar-investigation](https://github.com/rhodey/dogecoin-lunar-investigation) for such details.

## Create PDFs
Notice that `lib/download-coin-prices.js` is excluded with `.gitignore` plus three CSV files. It may be the case that I have a software to scrape coin prices 'unauthorized' which I have decided against publishing. With these three files out of place price history will be rendered from random.
```
$ npm install
$ npm run pdf-month 1/2020
$ npm run pdf-year 2020
$ ls dist/
year.pdf month.pdf
```

## Configure Coinbase
Copy `example.env` then add your Coinbase API keys following the example. You will need to have Dogecoin, Bitcoin, and Ethereum wallets online with Coinbase and the API keys must be authorized for these wallets.
```
$ cp example.env .env
$ export $(cat .env | xargs)
$ node lib/coinbase-init-accounts.js >> .env
$ export $(cat .env | xargs)
```

## Work With Coinbase
Notice that the third program documented works with `addressId`:
```
$ npm run create-address DOGE
> $dogeAddress, $addressId
$ npm run address-id-of DOGE $dogeAddress
> $addressId
$ npm run get-receipt DOGE $addressId
> $totalUsd, $totalCoin
```

## HTTP Server
These commands plus file `nginx.conf` may be used to develop the website locally.
```
$ npm run dist
$ docker run --name nginx -d \
    -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro \
      -v $(pwd)/dist:/usr/share/nginx/html:ro \
        --network host nginx
```

## App Server
An application server supports the website by invoking the earlier programs behind a captcha.
```
$ npm run app-http 8081
```

## License
Copyright 2022 - GPL v3 - mike@rhodey.org
