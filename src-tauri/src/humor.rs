use rand::Rng;
use std::collections::HashMap;

lazy_static::lazy_static! {
    static ref ENCRYPTION_JOKES: Vec<&'static str> = vec![
        "Hiding your secrets better than your browser history...",
        "Making your files more mysterious than your dating life",
        "Encrypting... Because apparently trust issues extend to filesystems",
        "Securing your data like it's nuclear launch codes",
        "Your files are now safer than your emotional walls",
        "Encrypting with the paranoia of a conspiracy theorist",
        "Making your data disappear like your motivation on Monday",
        "Securing files like they contain your deepest darkest secrets",
        "Encryption in progress... Your paranoia is now digitally validated",
        "Making your files more secure than your ex's new relationship"
    ];

    static ref DECRYPTION_JOKES: Vec<&'static str> = vec![
        "Unlocking secrets... This better not be another folder of cat memes",
        "Decrypting... Hope you remember this password better than your anniversary",
        "Breaking the code... No, not your moral code, the encryption one",
        "Unlocking your files like a digital locksmith",
        "Decrypting... Because apparently you trust yourself now",
        "Unlocking secrets that were safer than your dating choices",
        "Decrypting with the hope that you didn't forget the password",
        "Breaking the encryption like it's a bad habit",
        "Unlocking files... Your digital vault is about to spill its secrets",
        "Decrypting... Time to see what you were hiding from yourself"
    ];

    static ref ERROR_JOKES: Vec<&'static str> = vec![
        "Something went wrong... It's not you, it's definitely the code",
        "Error encountered... Even our errors are encrypted apparently",
        "File not found... Much like my motivation on Monday mornings",
        "Operation failed... Like my attempts at adulting",
        "Error occurred... Because apparently nothing can go smoothly",
        "Something broke... Probably your will to live",
        "Error detected... Much like the errors in my life choices",
        "Operation failed... Like my diet plans",
        "Error encountered... Because perfection is overrated",
        "Something went wrong... Welcome to the club"
    ];

    static ref SUCCESS_JOKES: Vec<&'static str> = vec![
        "Mission accomplished... Your paranoia is now digitally validated",
        "Files secured... They're safer than your emotional walls now",
        "Operation successful... Like that one time you made good life choices",
        "Task completed... Your secrets are now properly hidden",
        "Success achieved... Your files are now more secure than your ex's new relationship",
        "Mission accomplished... Your data is now as mysterious as your dating life",
        "Operation successful... Your paranoia has been justified",
        "Task completed... Your files are now safer than your browser history",
        "Success achieved... Your secrets are now properly encrypted",
        "Mission accomplished... Your data is now as secure as your emotional walls"
    ];

    static ref GENERAL_JOKES: Vec<&'static str> = vec![
        "Encrypting your files, because therapy is too expensive.",
        "Deleting files like your ex deletes your number.",
        "Keeping files? Bold move. Hope you don't regret it.",
        "Erasing traces like a pro—no one will ever know you had that file. Probably.",
        "Remember: If you forget your password, not even your future self can save you.",
        "Securing your data like it's nuclear launch codes.",
        "Your files are now safer than your emotional walls.",
        "Making your data disappear like your motivation on Monday.",
        "Encryption: Because apparently trust issues extend to filesystems.",
        "Your secrets are now as secure as your dating life is chaotic."
    ];
}

pub fn get_random_joke() -> String {
    let mut rng = rand::thread_rng();
    GENERAL_JOKES[rng.gen_range(0..GENERAL_JOKES.len())].to_string()
}

pub fn get_encryption_joke() -> String {
    let mut rng = rand::thread_rng();
    ENCRYPTION_JOKES[rng.gen_range(0..ENCRYPTION_JOKES.len())].to_string()
}

pub fn get_decryption_joke() -> String {
    let mut rng = rand::thread_rng();
    DECRYPTION_JOKES[rng.gen_range(0..DECRYPTION_JOKES.len())].to_string()
}

pub fn get_error_joke() -> String {
    let mut rng = rand::thread_rng();
    ERROR_JOKES[rng.gen_range(0..ERROR_JOKES.len())].to_string()
}

pub fn get_success_joke() -> String {
    let mut rng = rand::thread_rng();
    SUCCESS_JOKES[rng.gen_range(0..SUCCESS_JOKES.len())].to_string()
}

pub fn get_contextual_joke(context: &str) -> String {
    match context {
        "encryption" => get_encryption_joke(),
        "decryption" => get_decryption_joke(),
        "error" => get_error_joke(),
        "success" => get_success_joke(),
        _ => get_random_joke(),
    }
}

pub fn get_progress_joke(progress: f64) -> String {
    let mut rng = rand::thread_rng();
    
    if progress < 0.25 {
        vec![
            "Just getting started... Like your morning motivation",
            "Beginning the process... Because apparently we can't rush perfection",
            "Starting up... Like your computer on a Monday morning"
        ][rng.gen_range(0..3)].to_string()
    } else if progress < 0.5 {
        vec![
            "Making progress... Unlike your life goals",
            "Halfway there... Like your attempts at adulting",
            "Getting there... Slowly but surely, like your career"
        ][rng.gen_range(0..3)].to_string()
    } else if progress < 0.75 {
        vec![
            "Almost done... Like your patience",
            "Nearly finished... Unlike your to-do list",
            "Getting close... Like your relationship with productivity"
        ][rng.gen_range(0..3)].to_string()
    } else {
        vec![
            "Almost there... Like your will to live",
            "Nearly complete... Unlike your life plans",
            "Finishing up... Like your motivation for the day"
        ][rng.gen_range(0..3)].to_string()
    }
}