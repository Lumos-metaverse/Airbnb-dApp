import React, { useState } from 'react'

const ReserveModal = ({setModal, currentApartment, apartmentId, makeReservation}) => {

    const [noOfDays, setNoOfDays] = useState(null);

    console.log(noOfDays);

    const makeReservationHandler = () => {
        if(noOfDays === null || noOfDays === 0) {
            alert("Number of days can't be null or zero");
        } else {
            makeReservation(currentApartment, apartmentId, noOfDays);
            setModal(false);
        }
    }

    return (
        <div id="referral_link" data-backdrop="static" data-keyboard="false" tabIndex="-1"
            aria-labelledby="staticBackdropLabel" style={{ width: "100%", height: "100vh", margin: "0 auto", position: "absolute", top: "12%", zIndex: "100", overflowY: "scroll" }}>
            <div className="overlay"></div>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header pb-0  d-flex justify-content-center" style={{ border: "none" }}>
                        <button onClick={() => setModal(false)} type="button" className="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">
                                <img src="img/cancel.png" alt="" width="30" />
                            </span>
                        </button>
                    </div>
                    <div className="modal-body d-flex justify-content-center mb-5">
                        <div>
                            <h4 className="modal-title text-center" id="deleteLabel">Make Reservations</h4>
                            <hr />
                            <h5 className='text-center'>{currentApartment.name}</h5>
                            <p className='text-center'>{currentApartment.description}</p>
                            <div className="text-center mt-4 mb-2">
                                <div className="form-group">
                                    <label htmlFor="days">Number of Days</label>
                                    <input onChange={(e) => setNoOfDays(e.target.value)} id="days" type="number" min="1" className='form-control text-center' placeholder='Booking days' />
                                </div>
                                <button className='btn btn-danger btn-block' onClick={makeReservationHandler}>Make Reservation</button>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer justify-content-center mt-5" style={{ border: "none", gap: "1rem" }}>
                        <a href="#!" className="btn border"><img src="img/Instagram.png" alt="" width="40" /></a>
                        <a href="#!" className="btn border"><img src="img/Facebook.png" alt="" width="40" /></a>
                        <a href="#!" className="btn border"><img src="img/whatsapp.png" alt="" width="40" /></a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ReserveModal