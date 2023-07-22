import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Link from '../../components/Link';
import { DialogContentText, Box, styled } from '@mui/material';
import Router from 'next/router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../../firebase/clientApp';
import { doc, getDoc } from 'firebase/firestore';
// const staffAuth = collection(fireStore, "usersRequest");

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

function Login() {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [validateAuth, setValidateAuth] = useState("");
    const [error, setError] = useState({ email: "", password: "", validateAuth: "" });

    const handleLogin = () => {
        let isValid = true;
        let errors = { email: "", password: "", validateAuth: "" };

        if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email.trim())) {
            isValid = false;
            errors.email = "Please enter a valid email address.";
        }

        if (password.trim().length < 6) {
            isValid = false;
            errors.password = "Password must be at least 6 characters long.";
        }

        setError(errors);

        if (isValid) {
            signInWithEmailAndPassword(auth, email, password)
                .then(async (userCredential) => {
                    // Signed in 
                    const user = userCredential.user;
                    console.log(user.uid)
                    const docRef = doc(db, 'registeredusers', user.uid);

                    try {   
                        const docSnap = await getDoc(docRef);

                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            const id = docSnap.id;
                            const fieldValue = data.userRole;
                            const name = data.userName;


                            localStorage.setItem("role", fieldValue);
                            localStorage.setItem("id", id);
                            localStorage.setItem("name", name);
                        } else {
                            // Handle the case when the document doesn't exist
                        }
                    } catch (error) {
                        // Handle any errors that occur during fetching the document
                        console.error('Error fetching document:', error);
                    }
                    Router.push('../dashboard');
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    errors.validateAuth = errorMessage;
                    setPassword("");
                    setEmail("");
                });
        };
    };

    const handleRegister = () => {
        Router.push('/register');
    };

    return (
        <React.Fragment>
            <Head>
                <title>Login - siLVoam hospital</title>
            </Head>
            <Root>
                <Typography variant="h1" gutterBottom>
                    Login Page
                </Typography>

                <Typography variant="h3" gutterBottom>
                    Please enter your credentials!
                </Typography>

                <Box width={1 / 3} minWidth={240} marginY={2}>
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="id"
                        label="Employee Email"
                        name="id"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        helperText={error.email}
                        error={error.email.length > 0}
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
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        helperText={error.password}
                        error={error.password.length > 0}
                    />
                    {error.validateAuth && <p >User not found</p>}
                    <Box marginTop={2}>
                        <Button variant="contained" color="secondary" onClick={handleLogin} fullWidth>
                            Login
                        </Button>
                    </Box>
                    <Typography gutterBottom>
                        <Link href="/auth/register">Don't have account? Register here!</Link>
                    </Typography>
                </Box>
            </Root>
        </React.Fragment>
    );
};

export default Login