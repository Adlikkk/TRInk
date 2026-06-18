use std::{env, fs, path::PathBuf};

fn main() {
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").expect("missing CARGO_MANIFEST_DIR"));
    let config_path = manifest_dir
        .parent()
        .expect("src-tauri should have a parent")
        .join("config")
        .join("edition-config.json");

    println!("cargo:rerun-if-changed={}", config_path.display());
    println!("cargo:rerun-if-env-changed=TRINK_EDITION");

    let edition = env::var("TRINK_EDITION").unwrap_or_else(|_| "trading".into());
    let config_text = fs::read_to_string(&config_path).expect("failed to read edition-config.json");
    let config: serde_json::Value =
        serde_json::from_str(&config_text).expect("failed to parse edition-config.json");
    let editions = config["editions"]
        .as_object()
        .expect("edition-config.json must contain an editions object");
    let metadata = editions
        .get(&edition)
        .or_else(|| editions.get("trading"))
        .expect("edition metadata missing");

    let product_name = metadata["productName"]
        .as_str()
        .expect("edition productName missing");
    let edition_label = metadata["editionLabel"]
        .as_str()
        .expect("edition editionLabel missing");

    println!("cargo:rustc-env=TRINK_PRODUCT_NAME={product_name}");
    println!("cargo:rustc-env=TRINK_EDITION_LABEL={edition_label}");

    tauri_build::build()
}
