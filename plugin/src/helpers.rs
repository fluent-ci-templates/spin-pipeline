use extism_pdk::FnResult;
use fluentci_pdk::dag;

pub fn setup_rust() -> FnResult<()> {
    dag().call(
        "https://pkg.fluentci.io/rust@v0.10.2?wasm=1",
        "target_add",
        vec!["wasm32-wasi"],
    )?;
    Ok(())
}

pub fn setup_spin() -> FnResult<()> {
    let path = dag().get_env("PATH")?;
    let home = dag().get_env("HOME")?;

    dag().set_envs(vec![(
        "PATH".into(),
        format!("{}/.local/bin:{}", home, path),
    )])?;

    dag()
        .pkgx()?
        .with_packages(vec!["curl"])?
        .with_exec(vec!["type spin > /dev/null || curl -fsSL https://developer.fermyon.com/downloads/install.sh | bash"])?
        .with_exec(vec!["type spin > /dev/null || chmod a+x spin"])?
        .with_exec(vec!["type spin > /dev/null || mkdir -p $HOME/.local/bin"])?
        .with_exec(vec!["type spin > /dev/null || mv spin $HOME/.local/bin"])?
        .with_exec(vec!["spin --version"])?
        .stdout()?;
    Ok(())
}
