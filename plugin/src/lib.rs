use crate::helpers::{setup_rust, setup_spin};
use extism_pdk::*;
use fluentci_pdk::dag;

pub mod helpers;

#[plugin_fn]
pub fn build(args: String) -> FnResult<String> {
    setup_rust()?;
    setup_spin()?;

    let stdout = dag()
        .pipeline("build")?
        .with_exec(vec!["PATH=$HOME/.cargo/bin:$PATH", "spin", "build", &args])?
        .stdout()?;

    Ok(stdout)
}

#[plugin_fn]
pub fn deploy(args: String) -> FnResult<String> {
    setup_rust()?;
    setup_spin()?;

    let stdout = dag()
        .pipeline("deploy")?
        .with_exec(vec!["spin", "login", "--auth-method", "token"])?
        .with_exec(vec!["PATH=$HOME/.cargo/bin:$PATH", "spin", "deploy", &args])?
        .stdout()?;

    Ok(stdout)
}
