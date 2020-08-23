const fetch = require('node-fetch')
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan')
const fs = require('fs').promises
const app = express()
let port = process.env.PORT || 3007;

app.use(cors)
app.use(bodyParser.json({ extended: false }));
app.get('/', getData)

updateData()
setInterval(updateData, 600000)

function cors (req, res, next) {
  const origin = req.headers.origin

  res.setHeader('Access-Control-Allow-Origin', origin || '*')
  res.setHeader(
    'Access-Control-Allow-Methods',
    'POST, GET, PUT, DELETE, OPTIONS, XMODIFY'
  )
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept'
  )
  next()
}

app.post('/getrank', getRank)

function getUserInfo(amount) {

  if (amount >= 10000000) return {rank: "General"}
  if (amount >= 1000000) return {rank: "Colonel", nextRank: 10000000}
  if (amount >= 500000) return {rank: "Major", nextRank: 1000000}
  if (amount >= 100000) return {rank: "Captain", nextRank: 500000}
  if (amount >= 50000) return {rank: "Lieutenant", nextRank: 100000}
  if (amount >= 10000) return {rank: "Sergeant", nextRank: 50000}
  if (amount >= 5000) return {rank: "Corporal", nextRank: 10000}
  if (amount >= 1000) return {rank: "Specialist", nextRank: 5000}
  if (amount >= 500) return {rank: "Private", nextRank: 1000}
  if (amount >= 0) return {rank: "Unranked", nextRank: 500}
}

function getRank (req, res) {
  if (!req.body.address || req.body.address.length < 42) return res.send({error: true, message: "Account not found"})
  let address = req.body.address.toLowerCase()
  fs.readFile('./balances.json')
    .then(rawData => JSON.parse(rawData))
    .then(accounts => {
      console.log(accounts[0])
      const userAccount = accounts.find(account => account.a === address)
      if (userAccount) {
        const info = getUserInfo(userAccount.b)
        userAccount.rankInfo = info
        return res.send(userAccount)
      }
      return res.send({error: true, message: "Account not found"})
    })
    .catch(err => res.send({error: true, message: "Account not found"}))
  
}

function getData (req, res) {
  fs.readFile('./currentData.json')
    .then(rawData => JSON.parse(rawData))
    .then(data => res.json(data))
}

function updateData () { 
  let currentData = 
  { ranks: 
    {
      generals: 0, // > 10 million
      colonels: 0, // 10 million to 1 million
      majors: 0,   // 1 million to 500 thousand
      captains: 0, // 500 thousand to 100 thousand
      lieutenants: 0, // 100 thousand to 50 thousand
      sergeants: 0 , // 50 thousand to 10 thousand
      corporal: 0, // 10 thousand to 5 thousand
      specialist: 0, // 5 thousand to 1 thousand
      private: 0 // 1 thousand to 500
    },
    updateTime: Date(Date.now()),
  }
  let balances 
  let balanceArray = []
  let stakes
  let flatStakes = []
  let convert = (stringNumber) => Math.round((Number(stringNumber) / 10e17) * 100) / 100

  fetch('https://www.wanscan.org/api/wan/stakes')
  .then(response => response.json())
  .then(data => stakes = data)
  .then(() => fetch('https://www.wanscan.org/api/wan/balances'))
  .then(response => response.json())
  .then(data => {
    balances = data
    return balances
  })
  .then(balances => JSON.stringify(balances))
  .then(text => fs.writeFile('./originalBalances.json', text))
  .then(() => {
    balances.forEach(balance => balance.b = convert(balance.b))
    stakes.forEach(validator => {
      validator.partners.forEach(partner => flatStakes.push({a: partner.address, b: convert(partner.amount)}))
      validator.delegators.forEach(delegator => flatStakes.push({a: delegator.address, b: convert(delegator.amount)}))
      if (validator.address === "0x718cdf26d1b0eea6581343296f20ebac7c38c762") console.log(validator)
      flatStakes.push({a: validator.address, b: convert(validator.ownAmount)})
    })
    flatStakes.forEach(stakeAccount => {
      let matchingAccount = balances.find(balance => balance.a === stakeAccount.a)
      if (matchingAccount) matchingAccount.b = (Number(matchingAccount.b) + Number(stakeAccount.b))
      else balances.push({a: stakeAccount.a, b: stakeAccount.b})
    })
    balances = balances.sort((balance1, balance2) => balance2.b - balance1.b)
    balances.forEach(balance => {
      balanceArray.push(balance.b)
      if (balance.b >= 10000000) currentData.ranks.generals += 1
      if (balance.b < 10000000 && balance.b >= 1000000) currentData.ranks.colonels += 1
      if (balance.b < 1000000 && balance.b >= 500000) currentData.ranks.majors += 1
      if (balance.b < 500000 && balance.b >= 100000) currentData.ranks.captains += 1
      if (balance.b < 100000 && balance.b >= 50000) currentData.ranks.lieutenants += 1
      if (balance.b < 50000 && balance.b >= 10000) currentData.ranks.sergeants += 1
      if (balance.b < 10000 && balance.b >= 5000) currentData.ranks.corporal += 1
      if (balance.b < 5000 && balance.b >= 1000) currentData.ranks.specialist += 1
      if (balance.b < 1000 && balance.b >= 500) currentData.ranks.private += 1
    })
  })
  .then(() => JSON.stringify(currentData))
  .then(text => {
    fs.writeFile('./currentData.json', text)
  })
  .then(() => JSON.stringify(balances))
  .then(text => {
    fs.writeFile('./balances.json', text)
  })
  .catch(err => console.log(err))
}


app.listen(port);