document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registrationForm");

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const firstName = document.getElementById("firstName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const role = document.getElementById("role").value;

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }
        // Here you can add code to save the user data to a database or local storage
        const user = {
            firstName,
            lastName,
            email,
            password,
            role
        };

        console.log("Registered User:", user);

        alert(
            `Registration Successful!\n\n` +
            `Name: ${firstName} ${lastName}\n` +
            `Email: ${email}\n` +
            `Role: ${role}`
        );

        form.reset();
    });
});