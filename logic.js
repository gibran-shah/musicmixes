function startApp() {
    ajax(
        'fetch',
        'GET',
        null,
        (response) => {
            console.log('success');
        },
        (error) => {
            console.log(error);
        }
    );
}

startApp();