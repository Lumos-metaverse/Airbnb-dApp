import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { NFTStorage, File } from 'nft.storage';
import { Contract, providers, ethers } from 'ethers';
import Web3Modal from 'web3modal';
import ReserveModal from "./modals/ReserveModal";

import {
    AIRBNB_CONTRACT_ADDRESS,
    AIRBNB_ABI
  } from "../contract";

const Home = () => {
    const CHAIN_ID = 80001;
    const NETWORK_NAME = "Mumbai";
    const CURRENCY = "MATIC";

    const [walletConnected, setWalletConnected] = useState(false);
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null)
    const [apartmentName, setApartmentName] = useState(null);
    const [apartmentDescription, setApartmentDescription] = useState(null);
    const [pricePerNight, setPricePerNight] = useState(null);
    const [file, setFile] = useState(null);
    const [processingMessage, setProcessingMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [contractOwner, setContractOwner] = useState(null);
    const [apartments, setApartments] = useState([]);
    const [modal, setModal] = useState(false);
    const [currentApartment, setCurrentApartment] = useState(null);
    const [apartmentId, setApartmentId] = useState(null);

    const web3ModalRef = useRef();

    const client = new NFTStorage({ token: process.env.REACT_APP_NFT_STORAGE_KEY });

    const toggleModal = (apartment, index) => {
        setCurrentApartment(apartment);
        setApartmentId(index);
        setModal(!modal);
    }

    // Helper function to fetch a Provider instance from Metamask
    const getProvider = useCallback(async () => {
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);
      const getSigner = web3Provider.getSigner();

      const { chainId } = await web3Provider.getNetwork();

      setAccount(await getSigner.getAddress());
      setWalletConnected(true)


    if (chainId !== CHAIN_ID) {
      window.alert(`Please switch to the ${NETWORK_NAME} network!`);
        throw new Error(`Please switch to the ${NETWORK_NAME} network`);
      }
      setProvider(web3Provider);
  }, []);

  // Helper function to fetch a Signer instance from Metamask
  const getSigner = useCallback(async () => {
      const web3Modal = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(web3Modal);

      const { chainId } = await web3Provider.getNetwork();

      if (chainId !== CHAIN_ID) {
      window.alert(`Please switch to the ${NETWORK_NAME} network!`);
          throw new Error(`Please switch to the ${NETWORK_NAME} network`);
      }
      
      const signer = web3Provider.getSigner();
      return signer;
  }, []);


  const getAirBNBInstance = useCallback((providerOrSigner) => {
    return new Contract(
        AIRBNB_CONTRACT_ADDRESS,
        AIRBNB_ABI,
        providerOrSigner
    )
  },[]);

  const connectWallet = useCallback(async () => {
    try {
        web3ModalRef.current = new Web3Modal({
            network: NETWORK_NAME,
            providerOptions: {},
            disableInjectedProvider: false,
        });

        await getProvider();
    } catch (error) {
        console.error(error);
    }
  },[getProvider]);

  const addApartment = async (e) => {
    e.preventDefault();

    try {
        setLoading(true);

        setProcessingMessage("Uploading Image");

        const metadata = await client.store({
            name: apartmentName,
            description: apartmentDescription,
            image: new File([file], 'nft.jpg', { type: 'image/jpeg' })
        });

        console.log(metadata);

        const cid = metadata.ipnft;
        const priceInWei = ethers.utils.parseEther(pricePerNight);

        setProcessingMessage("Creating a Apartment");

        const signer = await getSigner();
        const airbnbContract = getAirBNBInstance(signer);
        const txn = await airbnbContract.addApartment(apartmentName, apartmentDescription, cid, priceInWei);
        await txn.wait();
        setLoading(false);
        setProcessingMessage(null);
    } catch (error) {
        console.error(error);
    }
  }

  const makeReservation = async (selectedApartment, apartmentId, noOfDays) => {
    try {
        const amountToPay = selectedApartment.pricePerNight * noOfDays;

        const signer = await getSigner();
        const airbnbContract = getAirBNBInstance(signer);
        const txn = await airbnbContract.makeReservation(apartmentId, noOfDays, { value: amountToPay.toString() });
        setLoading(true);
        await txn.wait();
        setLoading(false);
    } catch (error) {
        console.error(error);
    }
  }

  useEffect(() => {
    const fetchAirBnbContractDetails = async () => {
      if(account && provider){
        const airbnbContract = getAirBNBInstance(provider);
        const allApartments = await airbnbContract.getAllApartments();
        const owner = await airbnbContract.owner();

        setApartments(allApartments);
        setContractOwner(owner);
      }
    }

    fetchAirBnbContractDetails()
  }, [account, provider]);

  useEffect(() => {
    if(!walletConnected) {
        connectWallet();
    }
  }, [walletConnected, connectWallet]);

  return (
    <Fragment>
        {modal && <ReserveModal setModal={setModal} currentApartment={currentApartment} apartmentId={apartmentId} makeReservation={makeReservation} />}
        <div className="container mb-5">
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
                <a className="navbar-brand text-danger font-weight-bold" href="!#">Decentralized AirBNB</a>
                
                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarText" aria-controls="navbarText" aria-expanded="false" aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarText">
                    <ul className="navbar-nav mr-auto"></ul>
                    
                    <span className="navbar-text">
                        {!walletConnected ? <button className="btn btn-secondary" onClick={connectWallet}>Connect Wallet</button> : <button className="btn btn-danger" disabled>{account !== null && `Connected: ${account.substring(0, 8)}...${account.substring(38)}`}</button>}
                    </span>
                </div>
            </nav>
        </div>

        <div className="container">
            {account === contractOwner && 
                <div className="row">
                    <div className="col-md-3"></div>
                    <div className="col-md-6 mb-5">
                        <div className="card">
                            <div className="card-body">
                                <form>
                                    <div className="form-group">
                                        <label htmlFor="name">Apartment Name</label>
                                        <input id="name" type="text" onChange={(e) => setApartmentName(e.target.value)} className='form-control' />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="description">Description</label>
                                        <input id="description" type="text" onChange={(e) => setApartmentDescription(e.target.value)} className='form-control' />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="price">Price per Night</label>
                                        <input id="price" type="number" min="0" onChange={(e) => setPricePerNight(e.target.value)} className='form-control' />
                                    </div>

                                    <div className='form-group'>
                                        <label htmlFor="image">Apartment Image</label>
                                        <input id="image" type="file" onChange={(e) => setFile(e.target.files[0])} className='form-control' />
                                    </div>

                                    <button className={loading ? "btn btn-secondary" : "btn btn-danger"} disabled={loading ? "disabled" : ""} onClick={addApartment}>{loading ? "Processing" : "Add Apartment"}</button>
                                    <p className='text-info'>{processingMessage !== null && processingMessage}</p>
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3"></div>
                </div>
            }

            <h3>Apartment Listing</h3>
            <div className="row mb-5">
                {apartments.length > 0 &&
                    apartments.map((apartment, index) => (
                        <div className='col-md-3 mb-4' key={index}>
                            <div className="card">
                                <img src={`https://ipfs.io/ipfs/${apartment.ipfsHash}/image/nft.jpg`} alt="" />

                                <div className="card-body">
                                    <h6 className='mb-1'>{apartment.name}</h6>
                                    <p className='text-secondary'>{apartment.description}</p>
                                    <p className={apartment.isAvailable ? "mb-0" : "mb-0 text-danger"}>{apartment.isAvailable ? "Available" : "Unavailable"}</p>
                                    <p>{apartment.pricePerNight !== null ? ethers.utils.formatEther(apartment.pricePerNight) : 0} {CURRENCY} : night</p>
                                </div>
                                
                                <div className="card-footer">
                                    {loading ? <button className='btn btn-info btn-sm btn-block'>Processing transaction ...</button> : 
                                        <div className='d-flex justify-content-between'>
                                            <button disabled={apartment.isAvailable ? "" : "disabled"} className="btn btn-secondary btn-sm" onClick={() => toggleModal(apartment, index)}>{apartment.isAvailable ? "Reserve" : "Reserved"}</button>
                                        </div>   
                                    }
                                </div>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    </Fragment>
  )
}

export default Home;