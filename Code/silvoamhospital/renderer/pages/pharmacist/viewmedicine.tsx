import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp, DocumentReference, deleteDoc, setDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../../firebase/clientApp';
import Sidebar from '../../components/Sidebar';
import { Alert, Box, DialogActions, Fab, MenuItem, Select, Snackbar, TextField, Typography } from '@mui/material';
import { Button } from '@mui/material';
import { makeStyles } from '@mui/material';
import { async } from '@firebase/util';
import { HydrationProvider, Client } from 'react-hydration-provider';
import { DataGrid } from '@mui/x-data-grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Grid from '@mui/material';
import { getAuth, deleteUser } from 'firebase/auth';
import AddIcon from '@mui/icons-material/Add';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { timeStamp } from 'console';
import DoneOutlineIcon from '@mui/icons-material/DoneOutline';

function ViewMedicine() {
    const [displayedMedicine, setDisplayedMedicine] = useState([]);
    const [dataChange, setDataChange] = useState(false);

    const [medicineName, setMedicineName] = useState("");
    const [medicineType, setMedicineType] = useState("");
    const [medicinePrice, setMedicinePrice] = useState("");
    const [medicineStock, setMedicineStock] = useState("");

    const [openForm1, setOpenForm1] = useState(false);
    const [openForm2, setOpenForm2] = useState(false);
    const [openForm3, setOpenForm3] = useState(false);

    const [alertMessage, setAlertMessage] = useState("");
    const [openSnackBar, setOpenSnackbar] = useState(false);

    const [clickedMedId, setClickedMedId] = useState("");
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const openDialog1 = () => {
        setOpenForm1(true);
    }

    const closeDialog1 = () => {
        setOpenForm1(false);
        setClickedMedId(null);
    }

    const openDialog2 = () => {
        setOpenForm2(true);
    }

    const closeDialog2 = () => {
        setOpenForm2(false);
        setClickedMedId(null);
    }

    const openDialog3 = () => {
        setOpenForm3(true);
    }

    const closeDialog3 = () => {
        setOpenForm3(false);
        setClickedMedId(null);
    }

    const handleSnackbar = () => {
        setOpenSnackbar(true);
    }

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    }

    const handleSearch = (query) => {
        setSearchQuery(query);
        const formattedQuery = query.toLowerCase();
        const filteredMed = displayedMedicine.filter((med) =>
            med.data.medicineName.toLowerCase().includes(formattedQuery)
        );
        setSearchResults(filteredMed);
    };

    const getMedicine = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'medicine'));
            const medicineData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                data: doc.data()
            }));
            setDisplayedMedicine(medicineData);
        }
        catch {
            console.log("error");
        }
    }

    const registerNewMedicine = async () => {
        const medicineRef = collection(db, 'medicine');
        const newMedicine = {
            medicineName: medicineName,
            medicineType: medicineType,
            medicineStock: medicineStock,
            medicinePrice: medicinePrice
        };

        try {
            await addDoc(medicineRef, newMedicine);
            handleSnackbar();
            setAlertMessage("Medicine succesfully added!");
            closeDialog1();
            setDataChange(true);
            // Optionally, you can perform any additional logic or show a success message.
        } catch (error) {
            console.error('Error registering patient:', error);
            // Optionally, you can handle the error and show an error message to the user.
        }
    };

    const deleteMedicine = async (uuid: string) => {
        try {
            const docRef = doc(db, 'medicine', uuid);
            const docSnapshot = await getDoc(docRef);

            if (docSnapshot.exists()) {
                await deleteDoc(docRef);
                setAlertMessage("Medicine succesfully deleted!");
                handleSnackbar();
                setDataChange(true);
            }
        }
        catch (error) {
            console.log(error);
        }
    }

    const updateMedicine = async () => {
        try {
            const docRef = doc(db, 'medicine', clickedMedId);
            const docSnapshot = await getDoc(docRef);

            if (docSnapshot.exists()) {
                await updateDoc(docRef, {
                    medicineName: medicineName,
                    medicineType: medicineType,
                    medicineStock: medicineStock,
                    medicinePrice: medicinePrice
                });
                setAlertMessage("Medicine succesfully updated!");
                handleSnackbar();
                setDataChange(true);
                closeDialog2();
            } else {
                console.log('User not found!');
            }
        } catch (error) {
            console.error('Error updating user approval status:', error);
        }
    }

    const resetForm = () => {
        setMedicineName(null);
        setMedicinePrice(null);
        setMedicineType(null);
        setMedicineStock(null);
    }

    //Fetch for the first time
    useEffect(() => {
        getMedicine();
    }, []);

    //Fetch every time data changes
    useEffect(() => {
        if (dataChange) {
            getMedicine();
            resetForm();
            setClickedMedId(null);
            setDataChange(false);
        }
    }, [dataChange]);

    const medicineList = searchQuery ? searchResults : displayedMedicine;

    return (
        <HydrationProvider>
            <Client>
                <React.Fragment>
                    <Box sx={{ display: "flex", marginTop: '75px' }}>
                        <Sidebar />
                        <div style={{ display: "flex", flexDirection: 'column', marginLeft: '55px' }}>
                            <h1>View Medicine List</h1>
                            <TextField
                                label="Search Staff"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                style={{width: '180px'}}
                            />
                            <Button
                                variant="contained"
                                onClick={() => {
                                    openDialog1();
                                }}
                                style={{ marginLeft: '5px', float: 'left', width: '200px' }}
                            >
                                Add Medicine
                            </Button>
                            {/* <TextField
                                label="Search Patients"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            /> */}
                            <Box component="main" sx={{ flexGrow: 1, marginLeft: '5px', marginTop: '50px' }}>
                                <DataGrid
                                    columns={[
                                        { field: 'MedicineID', headerName: 'Medicine ID', width: 200 },
                                        { field: 'MedicineName', headerName: 'Medicine Name', width: 200 },
                                        { field: 'MedicineType', headerName: 'Medicine Type', width: 140 },
                                        { field: 'MedicinePrice', headerName: 'Medicine Price', width: 130 },
                                        { field: 'MedicineStock', headerName: 'Medicine Stock', width: 180 },
                                        {
                                            field: 'action',
                                            headerName: 'Action',
                                            width: 400,
                                            renderCell: (params) => (
                                                <div>
                                                    <Button
                                                        variant="contained"
                                                        onClick={() => {
                                                            openDialog2();
                                                            setClickedMedId(params.row.MedicineID);
                                                        }}
                                                    // disabled={approvedId === params.row.id}
                                                    >
                                                        {/* {approvedId === params.row.id ? 'Updating...' : 'Update Roles'} */}
                                                        Update Medicine
                                                    </Button>
                                                    <Button
                                                        variant="contained"
                                                        onClick={() => {
                                                            openDialog3();
                                                            setClickedMedId(params.row.MedicineID);
                                                        }}
                                                        style={{ marginLeft: '50px' }}  
                                                    // disabled={approvedId === params.row.id}
                                                    >
                                                        {/* {approvedId === params.row.id ? 'Updating...' : 'Update Roles'} */}
                                                        Delete Medicine
                                                    </Button>
                                                </div>
                                            ),
                                        },
                                    ]}

                                    rows={medicineList.map((med) => ({
                                        id: med.id,
                                        MedicineID: med.id,
                                        MedicineName: med.data.medicineName,
                                        MedicineType: med.data.medicineType,
                                        MedicinePrice: med.data.medicinePrice,
                                        MedicineStock: med.data.medicineStock
                                    }))}
                                    autoHeight
                                />
                            </Box>
                        </div>
                    </Box>
                    <Dialog open={openForm1} onClose={closeDialog1}>
                        <DialogTitle>Add New Medicine</DialogTitle>
                        <DialogContent>
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="medicineName"
                                label="Medicine Name"
                                type="text"
                                id="medicineName"
                                autoFocus
                                value={medicineName}
                                onChange={(e) => setMedicineName(e.target.value)}
                            // helperText={error.registerName}
                            // error={error.registerName.length > 0}
                            />
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="medicineType"
                                label="Medicine Type"
                                type="text"
                                id="medicineType"
                                value={medicineType}
                                onChange={(e) => setMedicineType(e.target.value)}
                            // helperText={error.registerName}
                            // error={error.registerName.length > 0}
                            />

                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="medicinePrice"
                                label="Medicine Price"
                                type="medicinePrice"
                                id="medicinePrice"
                                value={medicinePrice}
                                onChange={(e) => setMedicinePrice(e.target.value)}
                            // helperText={error.registerPassword}
                            // error={error.registerPassword.length > 0}
                            />
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="medicineStock"
                                label="Medicine Stock"
                                type="text"
                                id="medicineStock"
                                value={medicineStock}
                                onChange={(e) => setMedicineStock(e.target.value)}
                            // helperText={error.registerPassword}
                            // error={error.registerPassword.length > 0}
                            />
                            {/* <FormHelperText error={!!error.registerRole}>{error.registerRole}</FormHelperText> */}
                            <Box marginTop={2}>
                                <Button variant="contained" color="secondary" onClick={registerNewMedicine} fullWidth>
                                    Register New Medicine
                                </Button>
                            </Box>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openForm2} onClose={closeDialog2}>
                        <DialogTitle>Update Medicine</DialogTitle>
                        <DialogContent>
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="medicineName"
                                label="Medicine Name"
                                type="text"
                                id="medicineName"
                                autoFocus
                                value={medicineName}
                                onChange={(e) => setMedicineName(e.target.value)}
                            // helperText={error.registerName}
                            // error={error.registerName.length > 0}
                            />
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="medicineType"
                                label="Medicine Type"
                                type="text"
                                id="medicineType"
                                value={medicineType}
                                onChange={(e) => setMedicineType(e.target.value)}
                            // helperText={error.registerName}
                            // error={error.registerName.length > 0}
                            />

                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="medicinePrice"
                                label="Medicine Price"
                                type="medicinePrice"
                                id="medicinePrice"
                                value={medicinePrice}
                                onChange={(e) => setMedicinePrice(e.target.value)}
                            // helperText={error.registerPassword}
                            // error={error.registerPassword.length > 0}
                            />
                            <TextField
                                variant="outlined"
                                margin="normal"
                                required
                                fullWidth
                                name="medicineStock"
                                label="Medicine Stock"
                                type="text"
                                id="medicineStock"
                                value={medicineStock}
                                onChange={(e) => setMedicineStock(e.target.value)}
                            // helperText={error.registerPassword}
                            // error={error.registerPassword.length > 0}
                            />
                            {/* <FormHelperText error={!!error.registerRole}>{error.registerRole}</FormHelperText> */}
                            <Box marginTop={2}>
                                <Button variant="contained" color="secondary" onClick={updateMedicine} fullWidth>
                                    Update Medicine
                                </Button>
                            </Box>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={openForm3} onClose={closeDialog3} PaperProps={{ style: { width: '400px', height: '300px' } }}>
                        <DialogTitle>Confirmation</DialogTitle>
                        <DialogContent>
                            <p>Are you sure you want to delete this medicine?</p>
                            <Button onClick={() => setOpenForm3(false)}>No</Button>
                            <Button
                                onClick={() => {
                                    deleteMedicine(clickedMedId);
                                    closeDialog3();
                                }}
                                color="primary"
                            >
                                Yes
                            </Button>
                        </DialogContent>
                    </Dialog>
                    <Snackbar
                        open={openSnackBar}
                        autoHideDuration={2000}
                        onClose={handleCloseSnackbar}
                        ContentProps={{ style: { backgroundColor: 'green' } }}
                    >
                        <Typography style={{ backgroundColor: '#edf7ed', color: '#2c512d', alignItems: 'center', display: 'flex', flexDirection: 'row', padding: '20px' }}>
                            <DoneOutlineIcon style={{ marginRight: '50px' }} />
                            {alertMessage}
                        </Typography>
                    </Snackbar>
                </React.Fragment>
            </Client>
        </HydrationProvider >

    );
}

export default ViewMedicine;
