# pirple3

# **pizza ordering api**

This API is [Homework Assignment #3](assignment.md) for the pirple online course. 

***TLDR*** for anyone marking this assignment: once you have [installed](#installation) and [configured](#api-configuration-files) the files, please create a default menu by running `new-user-test.sh` . 

Also, please note that the site is designed to run as a single page app, which fetches the contents of each virtual page dynamically using api calls. whilst typing hard links to a specific site area in the nav bar will still work (eg /account/create), the intent is that once the user navigates to the landing page of the site, all content is dynmically built in the browser using api calls.

To acheive this, a slight departure to the file structure taught in the course was made - page specific html and javascript now lives under /webapp


# before you begin

To use this api, you'll need API keys from two external services - mailgun & stripe

If you haven't done so already head on over to [mailgun](https://signup.mailgun.com/new/signup) and [stripe](https://dashboard.stripe.com/register) to get your API KEYs

To test drive the API you'll need your own set of these keys.


# installation
Clone this repository into a clean folder

    git clone https://github.com/jonathan-annett/pirple2.git
    cd pirple2
    #create folder for api setttings
    mkdir -p ../.apis

# api configuration files

**../.apis/stripe.json**  
*COPY/PASTE/EDIT TO REFLECT YOUR STRIPE API SETTINGS*

    {
     "api_key" : "test_your_secret_key_1234",
     "base_url" : "https://api.stripe.com/v1",
     "currency" : "aud",
     "currency_multiplier" : 100
    }


the `currency_multiplier` is used to convert menu prices to the appropiate stripe unit when making payments. eg 100 would mean a price of 9.99 on the menu is charged at 990 currency units with stripe.
<BR>
<BR>



**../.apis/mailgun.json**  
*COPY/PASTE/EDIT TO REFLECT YOUR MAILGUN API SETTINGS*

     {
         "api_key" : "**insert key here**",
        "base_url" : "https://api.mailgun.net/v3/INSERT_SANDBOX_HERE.mailgun.org",
        "sender" : "info@INSERT_SANDBOX_HERE.mailgun.org",
        "smtp":"smtp.mailgun.org",
        "user" : "postmaster@INSERT_SANDBOX_HERE.mailgun.org"
    }

<BR>
<BR>

**../.apis/localhost.json**  
*COPY/PASTE/EDIT TO CONTROL THE AUTO-GENERATION OF LOCALHOST CERTS*

    {
     "country" : "AU",
     "state" : "Victoria",
     "locality" : "Australia",
     "email" : "admin@example.com"
    }

<BR>

[***API Documentation***](lib/handlers/README.md)
