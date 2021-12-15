import './App.css';

import * as React from "react";
require('dotenv').config();
import { useEffect, useState } from "react";

import contractABI from './utils/WavePortal.json';
import { ethers } from "ethers";

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [message, setMessage] = useState("");
  const [allWaves, setAllWaves] = useState([]);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
        getAllWaves();

      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);

        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        setAllWaves(wavesCleaned);

        wavePortalContract.on("NewWave", (from, timestamp, message) => {
          console.log("NewWave", from, timestamp, message);

          setAllWaves(prevState => [...prevState, {
            address: from,
            timestamp: new Date(timestamp * 1000),
            message: message
          }]);
        });
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {
    if (!currentAccount) {
      alert("Connect your MetaMask wallet to continue!");
      return;
    }

    if (!message) {
      alert("Enter message to continue!");
      return;
    }

    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const waveportalContract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);

        let count = await waveportalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await waveportalContract.wave(message, { gasLimit: 300000 });

        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
        setMessage("");

        count = await waveportalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        alert("Ethereum object doesn't exist! Please setup your Ethereum wallet, such as MetaMask to continue!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
          👋 Hey there!
        </div>

        <div className="bio">
          Hi, I am Janvi and I'm curious about Web3. This is my first smart contract on the Ethereum blockchain.
          Connect your Ethereum wallet and wave at me!
          Lucky wavers get a chance to win some Eth.
        </div>
        <div className="inputBox">
          <input label="Message" placeholder="Enter your message here." value={message} onChange={e => setMessage(e.target.value)} className="inputNote" />

          <button className="waveButton" onClick={wave}>
            Wave at Me
          </button>

        </div>
        <div className="connectWalt">
          {!currentAccount && (
            <button className="connectBtn" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </div>


        {allWaves.map((wave, index) => {
          return (
            <div className="txnList" key={index} style={{ backgroundColor: "white", marginTop: "16px", padding: "8px" }}>
              <div className="txnItem" >Address: {wave.address}</div>
              <div className="txnItem">Time: {wave.timestamp.toString()}</div>
              <div className="txnItem">Message: {wave.message}</div>
            </div>)
        })}
      </div>

    </div>
  );
}