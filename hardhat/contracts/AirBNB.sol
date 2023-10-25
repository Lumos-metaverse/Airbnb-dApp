// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract AirBNB {

    address public owner;
    bool private paused = false;

    enum ReservationStatus { Active, Completed, Canceled }

    struct Apartment {
        string name;
        string description;
        string ipfsHash;
        uint256 pricePerNight; // in wei
        bool isAvailable;
    }

    struct Reservation {
        uint256 apartmentId;
        uint256 startTime;
        uint256 endTime;
        ReservationStatus status;
    }

    Apartment[] public apartments;
    mapping(address => Reservation[]) reservationsByUser;
    mapping(address => uint256) public pendingWithdrawals;

    event ApartmentAdded(uint256 apartmentId, string name);
    event ReservationMade(address indexed user, uint256 apartmentId);
    event ReservationCompleted(address indexed user, uint256 apartmentId);
    event ReservationCanceled(address indexed user, uint256 apartmentId);
    event FundsWithdrawn(address indexed user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can execute this");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addApartment(string memory _name, string memory _description, string memory _ipfsHash, uint256 _pricePerNight) external onlyOwner {
        Apartment memory newApartment = Apartment({
            name: _name,
            description: _description,
            ipfsHash: _ipfsHash,
            pricePerNight: _pricePerNight,
            isAvailable: true
        });
        apartments.push(newApartment);
        emit ApartmentAdded(apartments.length - 1, _name);
    }

    function makeReservation(uint256 _apartmentId, uint256 _noOfDays) external payable whenNotPaused {
        require(apartments[_apartmentId].isAvailable, "Apartment not available");
        require(block.timestamp + (_noOfDays * 1 days) > block.timestamp, "extend number of days");

        uint256 totalPrice = apartments[_apartmentId].pricePerNight * _noOfDays;

        require(msg.value == totalPrice, "Incorrect payment amount");

        apartments[_apartmentId].isAvailable = false;

        Reservation memory newReservation = Reservation({
            apartmentId: _apartmentId,
            startTime: block.timestamp,
            endTime: block.timestamp + (_noOfDays * 1 days),
            status: ReservationStatus.Active
        });

        reservationsByUser[msg.sender].push(newReservation);

        emit ReservationMade(msg.sender, _apartmentId);
    }

    function completeReservation(uint256 _reservationIndex) external whenNotPaused {
        Reservation storage userReservation = reservationsByUser[msg.sender][_reservationIndex];

        require(userReservation.status == ReservationStatus.Active, "Reservation is not active");
        require(block.timestamp > userReservation.endTime, "Reservation has not yet ended");

        apartments[userReservation.apartmentId].isAvailable = true;
        userReservation.status = ReservationStatus.Completed;

        emit ReservationCompleted(msg.sender, userReservation.apartmentId);
    }

    function cancelReservation(uint256 _reservationIndex) external whenNotPaused {
        Reservation storage userReservation = reservationsByUser[msg.sender][_reservationIndex];

        require(userReservation.status == ReservationStatus.Active, "Reservation is not active");

        apartments[userReservation.apartmentId].isAvailable = true;
        userReservation.status = ReservationStatus.Canceled;

        uint256 numOfNights = (userReservation.endTime - userReservation.startTime) / 1 days;
        uint256 refundAmount = apartments[userReservation.apartmentId].pricePerNight * numOfNights;
        pendingWithdrawals[msg.sender] += refundAmount;

        emit ReservationCanceled(msg.sender, userReservation.apartmentId);
    }

    function withdraw() external whenNotPaused {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        
        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        emit FundsWithdrawn(msg.sender, amount);
    }

    function togglePause() external onlyOwner {
        paused = !paused;
    }

    function getAllApartments() external view returns (Apartment[] memory) {
        return apartments;
    }

    function getUserReservations(address _user) external view returns (Reservation[] memory) {
        return reservationsByUser[_user];
    }

}
