import React from 'react';
import Head from 'next/head';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Link from '../components/Link';
import { styled } from '@mui/material';

const Root = styled('div')(({ theme }) => {
    return {
        textAlign: 'center',
        paddingTop: theme.spacing(4),
    };
})


function Home() {
    const [open, setOpen] = React.useState(false);
    const handleClose = () => setOpen(false);
    const handleClick = () => setOpen(true);


    return (
        <React.Fragment>
            <Head>
                <title>siLVoam hospital</title>
            </Head>
            <Root>
                <Typography variant='h1' gutterBottom>
                    Welcome to siLVoam hospital
                </Typography>
                <img width={900} height={300} src="images/logo.png" />
                <Typography gutterBottom>
                    <Button
                        style={{
                            width: '250px',
                            backgroundColor: '#202474',
                            padding: '10px',
                            marginTop: '40px',
                        }}
                    >
                        <Link href="/auth/signin" style={{color: 'white'}}>Sign In</Link>
                    </Button>
                </Typography>
                <Typography gutterBottom>
                    <Button
                        style={{
                            width: '250px',
                            backgroundColor: '#202474',
                            color: 'white',
                            padding: '10px',
                            marginTop: '40px',
                        }}
                    >
                        <Link href="/auth/register" style={{color: 'white'}}>Register</Link>
                    </Button>
                </Typography>
            </Root>
        </React.Fragment>
    );
};

export default Home;
