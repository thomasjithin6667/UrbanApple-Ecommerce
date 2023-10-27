setTimeout(function () {
    var logoutMessageElement = document.getElementById('logoutMessage');
    if (logoutMessageElement) {
        logoutMessageElement.style.display = 'none';
    }
}, 2000);


setTimeout(function () {
    var errorMessageElement = document.getElementById('errorMessage');
    if (errorMessageElement) {
        errorMessageElement.style.display = 'none';
    }
}, 3000);





//form validation

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('submit-form');
    const username = document.querySelector('input[name="name"]');
    const email = document.querySelector('input[name="email"]');
    const number = document.querySelector('input[name="mno"]');
    const password = document.querySelector('input[name="password"]');

    form.addEventListener('submit', e => {
        e.preventDefault();
        if (validateInputs()) {
            form.submit();
        }
    });

    const setError = (element, message) => {
        const inputControl = element.parentElement;
        const errorDisplay = inputControl.querySelector('.error');
        errorDisplay.innerText = message;
   
        inputControl.classList.remove('success');
    };

    const setSuccess = element => {
        const inputControl = element.parentElement;
        const errorDisplay = inputControl.querySelector('.error');
        errorDisplay.innerText = '';
        inputControl.classList.add('success');
        inputControl.classList.remove('error');
    };

    const validateInputs = () => {
        const usernameValue = username.value.trim();
        const emailValue = email.value.trim();
        const passwordValue = password.value.trim();
        const numberValue = number.value.trim();


        let isValid = true;

        if (usernameValue === '') {
            setError(username, 'Name required');
            isValid = false;
        } else if (!isValidName(usernameValue)) {
            setError(username, 'Only alphabets are allowed');
            isValid = false;
        } else if (usernameValue.length < 5) {
            setError(username, 'Minimum of 5 characters');
            isValid = false;
        } else {
            setSuccess(username);
        }

        if (emailValue === '') {
            setError(email, 'Email required');
            isValid = false;
        } else if (!isValidEmail(emailValue)) {
            setError(email, 'Invalid email format');
            isValid = false;
        } else {
            setSuccess(email);
        }

        



        if (numberValue === '') {
            setError(number, 'Phone number required');
            isValid = false;
        } else if (!isValidPhoneNumber(numberValue)) {
            setError(number, 'Invalid phone number format');
            isValid = false;
        } else {
            setSuccess(number);
        }

        if(passwordValue===''){
            setError(password,'password required')
        }else{
            setSuccess(password)
        }




        return isValid;
    };

    const isValidName = name => {
        const regex = /^[A-Za-z\s]+$/;
        return regex.test(name);
      };

    const isValidEmail = email => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };


    const isValidPhoneNumber = number => {
        const regex = /^\d{10}$/;
        return regex.test(number);
    };


});






//loginform validation

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('login-form');
  
    const email = document.querySelector('input[name="email"]');
    const password = document.querySelector('input[name="password"]');
   

    form.addEventListener('submit', e => {
        e.preventDefault();
        if (validateInputs()) {
            form.submit();
        }
    });

    const setError = (element, message) => {
        const inputControl = element.parentElement;
        const errorDisplay = inputControl.querySelector('.error');
        errorDisplay.innerText = message;
   
        inputControl.classList.remove('success');
    };

    const setSuccess = element => {
        const inputControl = element.parentElement;
        const errorDisplay = inputControl.querySelector('.error');
        errorDisplay.innerText = '';
        inputControl.classList.add('success');
        inputControl.classList.remove('error');
    };

    const validateInputs = () => {

        const emailValue = email.value.trim();
        const passwordValue = password.value.trim();

       


        let isValid = true;

    

        if (emailValue === '') {
            setError(email, 'Email required');
            isValid = false;
        } else if (!isValidEmail(emailValue)) {
            setError(email, 'Invalid email format');
            isValid = false;
        } else {
            setSuccess(email);
        }

        if(passwordValue==''){
            setError(password,'password required')
        }else{
            setSuccess(password)
        }





        return isValid;
    };


    const isValidEmail = email => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };




});

//category form validation
document.addEventListener('DOMContentLoaded', function () {
    const form3 = document.querySelector('form[name="categoryform"]'); 
    const category = document.querySelector('input[name="category"]');
    const description = document.querySelector('textarea[name="description"]');
    const image = document.querySelector('input[name="categoryImage"]');

    form3.addEventListener('submit', function (e) {
        e.preventDefault();
        if (validateInputs()) {
            form3.submit();
        }
    });

    const setError = (element, message) => {
        const inputControl = element.parentElement;
        const errorDisplay = inputControl.querySelector('.error');
        errorDisplay.innerText = message;
        inputControl.classList.remove('success');
    };

    const setSuccess = element => {
        const inputControl = element.parentElement;
        const errorDisplay = inputControl.querySelector('.error');
        errorDisplay.innerText = '';
        inputControl.classList.add('success');
        inputControl.classList.remove('error');
    };

    const validateInputs = () => {
        let isValid = true;

        // Category validation
        const categoryValue = category.value.trim();
        if (categoryValue === '') {
            setError(category, 'Category is required');
            isValid = false;
        } else {
            setSuccess(category);
        }

        // Description validation
        const descriptionValue = description.value.trim();
        if (descriptionValue === '') {
            setError(description, 'Description is required');
            isValid = false;
        } else {
            setSuccess(description);
        }

        // Image validation
        if (image.files.length === 0) {
            setError(image, 'Image is required');
            isValid = false;
        } else {
            setSuccess(image);
        }

        return isValid;
    };
});

//product form validation
document.addEventListener('DOMContentLoaded', function () {
    const form = document.forms['productform'];
    const name = form.elements['name'];
    const quantity = form.elements['quantity'];
    const productColor = form.elements['productColor'];
    const battery = form.elements['battery'];
    const ram = form.elements['ram'];
    const rom = form.elements['rom'];
    const expandable = form.elements['expandable'];
    const rearCam = form.elements['rearCam'];
    const frontCam = form.elements['frontCam'];
    const processor = form.elements['processor'];
    const price = form.elements['price'];
    const discountPrice = form.elements['discountPrice'];
    const category = form.elements['category'];

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (validateForm()) {
            form.submit();
        }
    });

    const setError = (element, message) => {
        const formGroup = element.closest('.mb-3');
        const errorDisplay = formGroup.querySelector('.error');
        errorDisplay.innerText = message;
        formGroup.classList.remove('success');
        formGroup.classList.add('error');
    };

    const setSuccess = (element) => {
        const formGroup = element.closest('.mb-3');
        const errorDisplay = formGroup.querySelector('.error');
        errorDisplay.innerText = '';
        formGroup.classList.remove('error');
        formGroup.classList.add('success');
    };

    const validateForm = () => {
        let isValid = true;

        if (name.value.trim() === '') {
            setError(name, 'Product title is required');
            isValid = false;
        } else {
            setSuccess(name);
        }

        if (quantity.value.trim() === '') {
            setError(quantity, 'Quantity is required');
            isValid = false;
        } else {
            setSuccess(quantity);
        }

        if (productColor.value.trim() === '') {
            setError(productColor, 'Product color is required');
            isValid = false;
        } else {
            setSuccess(productColor);
        }

        // Add validation for other fields here

        if (price.value.trim() === '') {
            setError(price, 'Price is required');
            isValid = false;
        } else {
            setSuccess(price);
        }

        if (discountPrice.value.trim() === '') {
            setError(discountPrice, 'Discount Price is required');
            isValid = false;
        } else {
            setSuccess(discountPrice);
        }

        let categoryChecked = false;
        category.forEach((radio) => {
            if (radio.checked) {
                categoryChecked = true;
            }
        });

        if (!categoryChecked) {
            setError(category[0], 'Please select a category');
            isValid = false;
        } else {
            category.forEach((radio) => {
                setSuccess(radio);
            });
        }

        return isValid;
    };
});



