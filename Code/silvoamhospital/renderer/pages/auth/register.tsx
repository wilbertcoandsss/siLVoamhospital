import React, { useState } from 'react';
import Head from 'next/head';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Link from '../../components/Link';
import { DialogContentText, Box, styled, Select, MenuItem, FormHelperText } from '@mui/material';
import Router from 'next/router';
import { auth, db } from '../../../firebase/clientApp';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { collection, setDoc, doc, getDocs, getDoc, query, orderBy, limit, serverTimestamp, addDoc, Timestamp } from 'firebase/firestore';
// const staffAuth = collection(fireStore, "usersRequest");
import { Toast } from 'react-toastify/dist/components';
import { toast } from 'react-toastify';

const Root = styled('div')(({ theme }) => {
    return {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: theme.spacing(4),
        background: '#F0F0F0'
    };
});

function Register() {

    const [registerEmail, setRegisterEmail] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [registerName, setRegisterName] = useState("");
    const [registerRole, setRegisterRole] = useState("");

    const [error, setError] = useState({ registerName: "", registerEmail: "", registerRole: "", registerPassword: "", validateAuth: "" });

    const [open, setOpen] = React.useState(false);
    const handleClose = () => setOpen(false);
    const handleClick = () => setOpen(true);

    async function isEmailUnique(email) {
        try {
            const signInMethods = await fetchSignInMethodsForEmail(auth, email);
            return signInMethods.length === 0; // If the email is not registered, the length will be 0
        } catch (error) {
            console.error('Error checking email uniqueness:', error);
            // Handle the error case (e.g., show an error message)
            return false; // Assuming you want to return false in case of an error
        }
    }

    const register = async () => {

        let isValid = true;
        let errors = { registerName: "", registerEmail: "", registerRole: "", registerPassword: "", validateAuth: "" };

        if (registerName.trim().length < 6) {
            isValid = false;
            errors.registerName = "Name must be at least 6 characters";
        }

        if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(registerEmail.trim())) {
            isValid = false;
            errors.registerEmail = "Please enter a valid email address.";
        }

        if (registerPassword.trim().length < 6) {
            isValid = false;
            errors.registerPassword = "Password must be at least 6 characters!";
        }

        if (registerRole.trim() === "" || registerRole.trim() == "Select Roles") {
            isValid = false;
            errors.registerRole = "Roles must be chosen!";
        }


        setError(errors);

        if (isValid) {
            let isAuth;
            try {
                const notifRef = collection(db, 'notification');

                await addDoc(notifRef, {
                    userRole: "admin",
                    content: "New Account Approval!",
                    notifDate: Timestamp.now(),
                })
                if (registerRole.trim() == "admin") {
                    isAuth = true;
                    console.log("Masuk gak sih" + isAuth);
                }
                else {
                    isAuth = false;
                    console.log("Masuk false" + isAuth)
                }
                const isUnique = await isEmailUnique(registerEmail);
                if (isUnique) {
                    const user = await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
                    addToFirestore(user.user.uid, isAuth);
                    console.log(user.user.uid);
                    handleClick();
                } else {
                    setError((prevErrors) => ({
                        ...prevErrors,
                        registerEmail: "Email is already in use"
                    }));
                }
            } catch (error) {
                console.log(error.message);
            }
        }
    }

    const handleRole = (event) => {
        setRegisterRole(event.target.value);
    }

    const addToFirestore = async (uid, isAuth) => {
        const userRef = collection(db, "registeredusers");

        console.log(isAuth);
        await setDoc(doc(userRef, uid), {
            userEmail: registerEmail,
            userName: registerName,
            userPassword: registerPassword,
            userRole: registerRole,
            isAuth: false,
            created_at: serverTimestamp(),
            approved_at: null
        });
    }

    const handleOkClick = () => {
        handleClose();
        Router.push('/home');
    };

    return (
        <React.Fragment>
            <Head>
                <title>Register - siLVoam hospital</title>
            </Head>
            <Root>
                <Typography variant="h1" gutterBottom>
                    Register Page
                </Typography>

                <Typography variant="h3" gutterBottom>
                    Create your account here!
                </Typography>

                <Box width={1 / 3} minWidth={240} marginY={2}>
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        name="name"
                        label="Name"
                        type="text"
                        id="name"
                        autoFocus
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        helperText={error.registerName}
                        error={error.registerName.length > 0}
                    />
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="id"
                        label="Email"
                        name="id"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        helperText={error.registerEmail}
                        error={error.registerEmail.length > 0}
                    />
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        helperText={error.registerPassword}
                        error={error.registerPassword.length > 0}
                    />
                    <Typography variant='h6' style={{ textAlign: 'center' }}>
                        Select Roles:
                    </Typography>
                    <Select defaultValue="default" onChange={handleRole} style={{ width: '100%' }}>
                        <MenuItem value="default">Select Roles</MenuItem>
                        <MenuItem value="doctor">Doctor</MenuItem>
                        <MenuItem value="nurse">Nurse</MenuItem>
                        <MenuItem value="pharmacist">Pharmacist</MenuItem>
                        <MenuItem value="kitchen">Kitchen</MenuItem>
                        <MenuItem value="cleaningservice">Cleaning Service</MenuItem>
                        <MenuItem value="driver">Ambulance Driver</MenuItem>
                    </Select>
                    <FormHelperText error={!!error.registerRole}>{error.registerRole}</FormHelperText>
                    <Box marginTop={2}>
                        <Button variant="contained" color="secondary" onClick={register} fullWidth>
                            Register
                        </Button>
                    </Box>
                    <Dialog open={open} onClose={handleClose}>
                        <DialogTitle>Notifications</DialogTitle>
                        <DialogContent>
                            <DialogContentText>Register Success!</DialogContentText>
                            <DialogContentText>Now wait for the approval!</DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button color="primary" onClick={handleOkClick}>
                                Ok
                            </Button>
                        </DialogActions>
                    </Dialog>
                    <Typography gutterBottom>
                        <Link href="/auth/signin">Already have account? Login here!</Link>
                    </Typography>
                </Box>
            </Root>
        </React.Fragment>
    );
};

export default Register;