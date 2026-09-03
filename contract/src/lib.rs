#![warn(clippy::style, missing_debug_implementations)]
#![cfg_attr(not(target_arch = "wasm32"), allow(dead_code))]

extern crate alloc;

pub const CONTRACT_VERSION: &str = "0.1.0";

wit_bindgen::generate!({
    world: "vendor-assurance",
    path: "wit",
    additional_derives: [serde::Deserialize, serde::Serialize],
    generate_all,
});

mod policy;

struct Component;

#[cfg(target_arch = "wasm32")]
fn decisions_map_name() -> alloc::string::String {
    let tenant = host::tenant::tenant_context::tenant_did();
    alloc::format!("z:{}:assurance-decisions", hex::encode(tenant))
}

#[cfg(target_arch = "wasm32")]
impl exports::z::vendor_assurance::contracts::Guest for Component {
    fn assess_vendor(
        req: exports::z::vendor_assurance::contracts::GenericInput,
    ) -> Result<alloc::vec::Vec<u8>, alloc::string::String> {
        let input = req.input.ok_or("assess-vendor: missing input")?;
        let output = policy::assess(&input)?;
        let decision: policy::AssuranceDecision = serde_json::from_slice(&output)
            .map_err(|error| alloc::format!("internal decision parse: {error}"))?;

        host::interfaces::kv_store::put(
            &decisions_map_name(),
            decision.vendor_id.as_bytes(),
            &output,
        )
        .map_err(|error| alloc::format!("persist decision: {error}"))?;

        let _ = host::interfaces::logging::info("vendor assurance decision persisted");
        Ok(output)
    }

    fn read_decision(
        req: exports::z::vendor_assurance::contracts::GenericInput,
    ) -> Result<alloc::vec::Vec<u8>, alloc::string::String> {
        let input = req.input.ok_or("read-decision: missing input")?;
        let request: serde_json::Value = serde_json::from_slice(&input)
            .map_err(|error| alloc::format!("invalid request JSON: {error}"))?;
        let vendor_id = request
            .get("vendor_id")
            .and_then(|value| value.as_str())
            .ok_or("read-decision: vendor_id is required")?;

        host::interfaces::kv_store::get(&decisions_map_name(), vendor_id.as_bytes())
            .map_err(|error| alloc::format!("read decision: {error}"))?
            .ok_or_else(|| "decision not found".to_string())
    }
}

#[cfg(target_arch = "wasm32")]
export!(Component);

#[cfg(test)]
mod tests {
    use super::CONTRACT_VERSION;

    #[test]
    fn contract_version_is_semver() {
        let parts: Vec<&str> = CONTRACT_VERSION.split('.').collect();
        assert_eq!(parts.len(), 3);
        assert!(parts.iter().all(|part| part.parse::<u32>().is_ok()));
    }
}

