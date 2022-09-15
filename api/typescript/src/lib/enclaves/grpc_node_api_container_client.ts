import {ok, err, Result, Err} from "neverthrow";
import type { ServiceError } from "@grpc/grpc-js";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import {
    StartServicesArgs,
    StartServicesResponse,
    RemoveServiceArgs,
    RepartitionArgs,
    WaitForHttpGetEndpointAvailabilityArgs,
    WaitForHttpPostEndpointAvailabilityArgs,
    GetServicesResponse,
    LoadModuleArgs,
    UnloadModuleArgs,
    GetModulesResponse,
    ExecuteModuleResponse,
    ExecuteModuleArgs,
    ExecCommandArgs,
    ExecCommandResponse,
    PauseServiceArgs,
    UnpauseServiceArgs,
    UploadFilesArtifactArgs,
    UploadFilesArtifactResponse,
    StoreWebFilesArtifactArgs,
    StoreWebFilesArtifactResponse,
    StoreFilesArtifactFromServiceArgs,
    StoreFilesArtifactFromServiceResponse,
    GetServicesArgs,
    GetModulesArgs,
    UnloadModuleResponse,
    RenderTemplatesToFilesArtifactArgs,
    RenderTemplatesToFilesArtifactResponse,
} from "../../kurtosis_core_rpc_api_bindings/api_container_service_pb";
import type { ApiContainerServiceClient as ApiContainerServiceClientNode } from "../../kurtosis_core_rpc_api_bindings/api_container_service_grpc_pb";
import { GenericApiContainerClient } from "./generic_api_container_client";
import { EnclaveID } from "./enclave_context";
import {RemoveServiceResponse} from "../../kurtosis_core_rpc_api_bindings/api_container_service_pb";

export class GrpcNodeApiContainerClient implements GenericApiContainerClient {

    private readonly client: ApiContainerServiceClientNode;
    private readonly enclaveId: EnclaveID;

    constructor(client: ApiContainerServiceClientNode, enclaveId: EnclaveID) {
        this.client = client;
        this.enclaveId = enclaveId;
    }

    public getEnclaveId(): EnclaveID {
        return this.enclaveId;
    }

    public async loadModule(loadModuleArgs: LoadModuleArgs): Promise<Result<null, Error>> {
        const loadModulePromise: Promise<Result<google_protobuf_empty_pb.Empty, Error>> = new Promise((resolve, _unusedReject) => {
            this.client.loadModule(loadModuleArgs, (error: ServiceError | null, response?: google_protobuf_empty_pb.Empty) => {
                if (error === null) {
                    if (!response) {
                        resolve(err(new Error("No error was encountered but the response was still falsy; this should never happen")));
                    } else {
                        resolve(ok(response!));
                    }
                } else {
                    resolve(err(error));
                }
            })
        });
        const loadModulePromiseResult: Result<google_protobuf_empty_pb.Empty, Error> = await loadModulePromise;
        if (loadModulePromiseResult.isErr()) {
            return err(loadModulePromiseResult.error);
        }

        return ok(null);
    }

    public async unloadModule(unloadModuleArgs: UnloadModuleArgs): Promise<Result<UnloadModuleResponse,Error>> {
        const unloadModulePromise: Promise<Result<UnloadModuleResponse, Error>> = new Promise((resolve, _unusedReject) => {
            this.client.unloadModule(unloadModuleArgs, (error: ServiceError | null, unloadModuleResponse: UnloadModuleResponse | undefined) => {
                if (error === null) {
                    if (!unloadModuleResponse) {
                        resolve(err(new Error("No error was encountered but the response was still falsy; this should never happen")));
                    } else {
                        resolve(ok(unloadModuleResponse!));
                    }
                } else {
                    resolve(err(error));
                }
            })
        })

        const unloadModuleResult: Result<UnloadModuleResponse, Error> = await unloadModulePromise;
        if (unloadModuleResult.isErr()) {
            return err(unloadModuleResult.error);
        }
        return ok(unloadModuleResult.value);
    }

    public async startServices(startServicesArgs: StartServicesArgs): Promise<Result<StartServicesResponse, Error>>{
        const promiseStartServices: Promise<Result<StartServicesResponse, Error>> = new Promise((resolve, _unusedReject) => {
            this.client.startServices(startServicesArgs, (error: ServiceError | null, response?: StartServicesResponse) => {
                if (error === null) {
                    if (!response) {
                        resolve(err(new Error("No error was encountered but the response was still falsy; this should never happen")));
                    } else {
                        resolve(ok(response!));
                    }
                } else {
                    resolve(err(error));
                }
            })
        });
        const resultStartServices: Result<StartServicesResponse, Error> = await promiseStartServices;
        if (resultStartServices.isErr()) {
            return err(resultStartServices.error);
        }

        const startServicesResponse: StartServicesResponse = resultStartServices.value;
        return ok(startServicesResponse)
    }

    public async removeService(args: RemoveServiceArgs): Promise<Result<RemoveServiceResponse, Error>> {
        const removeServicePromise: Promise<Result<RemoveServiceResponse, Error>> = new Promise((resolve, _unusedReject) => {
            this.client.removeService(args, (error: ServiceError | null, removeServiceResponse: RemoveServiceResponse | undefined) => {
                if (error === null) {
                    if (!removeServiceResponse) {
                        resolve(err(new Error("No error was encountered but the response was still falsy; this should never happen")))
                    } else {
                        resolve(ok(removeServiceResponse!));
                    }
                } else {
                    resolve(err(error));
                }
            })
        });
        const resultRemoveService: Result<RemoveServiceResponse, Error> = await removeServicePromise;
        if (resultRemoveService.isErr()) {
            return err(resultRemoveService.error);
        }
        
        return ok(resultRemoveService.value);
    }

    public async repartitionNetwork(repartitionArgs: RepartitionArgs): Promise<Result<null, Error>> {
        const promiseRepartition: Promise<Result<null, Error>> = new Promise((resolve, _unusedReject) => {
            this.client.repartition(repartitionArgs, (error: ServiceError | null, _unusedResponse?: google_protobuf_empty_pb.Empty) => {
                if (error === null) {
                    resolve(ok(null));
                } else {
                    resolve(err(error));
                }
            })
        });
        const resultRepartition: Result<null, Error> = await promiseRepartition;
        if (resultRepartition.isErr()) {
            return err(resultRepartition.error);
        }

        return ok(null);
    }

    public async waitForHttpGetEndpointAvailability(availabilityArgs: WaitForHttpGetEndpointAvailabilityArgs): Promise<Result<null, Error>> {
        const promiseWaitForHttpGetEndpointAvailability: Promise<Result<null, Error>> = new Promise((resolve, _unusedReject) => {
            this.client.waitForHttpGetEndpointAvailability(availabilityArgs, (error: ServiceError | null, _unusedResponse?: google_protobuf_empty_pb.Empty) => {
                if (error === null) {
                    resolve(ok(null));
                } else {
                    resolve(err(error));
                }
            })
        });
        const resultWaitForHttpGetEndpointAvailability: Result<null, Error> = await promiseWaitForHttpGetEndpointAvailability;
        if (resultWaitForHttpGetEndpointAvailability.isErr()) {
            return err(resultWaitForHttpGetEndpointAvailability.error);
        }

        return ok(null);
    }

    public async waitForHttpPostEndpointAvailability(availabilityArgs: WaitForHttpPostEndpointAvailabilityArgs): Promise<Result<null, Error>> {
        const promiseWaitForHttpPostEndpointAvailability: Promise<Result<null, Error>> = new Promise((resolve, _unusedReject) => {
            this.client.waitForHttpPostEndpointAvailability(availabilityArgs, (error: ServiceError | null, _unusedResponse?: google_protobuf_empty_pb.Empty) => {
                if (error === null) {
                    resolve(ok(null));
                } else {
                    resolve(err(error));
                }
            })
        });
        const resultWaitForHttpPostEndpointAvailability: Result<null, Error> = await promiseWaitForHttpPostEndpointAvailability;
        if (resultWaitForHttpPostEndpointAvailability.isErr()) {
            return err(resultWaitForHttpPostEndpointAvailability.error);
        }

        return ok(null);
    }

    public async getServices(getServicesArgs: GetServicesArgs): Promise<Result<GetServicesResponse, Error>> {
        const promiseGetServices: Promise<Result<GetServicesResponse, Error>> = new Promise((resolve, _unusedReject) => {
            this.client.getServices(getServicesArgs, (error: ServiceError | null, response?: GetServicesResponse) => {
                if (error === null) {
                    if (!response) {
                        resolve(err(new Error("No error was encountered but the response was still falsy; this should never happen")));
                    } else {
                        resolve(ok(response!));
                    }
                } else {
                    resolve(err(error));
                }
            })
        });

        const resultGetServices: Result<GetServicesResponse, Error> = await promiseGetServices;
        if (resultGetServices.isErr()) {
            return err(resultGetServices.error);
        }

        const getServicesResponse = resultGetServices.value;
        return ok(getServicesResponse)
    }

    public async getModules(getModulesArgs: GetModulesArgs): Promise<Result<GetModulesResponse, Error>> {
        const getModulesPromise: Promise<Result<GetModulesResponse, Error>> = new Promise((resolve, _unusedReject) => {
            this.client.getModules(getModulesArgs, (error: ServiceError | null, response?: GetModulesResponse) => {
                if (error === null) {
                    if (!response) {
                        resolve(err(new Error("No error was encountered but the response was still falsy; this should never happen")));
                    } else {
                        resolve(ok(response!));
                    }
                } else {
                    resolve(err(error));
                }
            })
        });

        const getModulesResult: Result<GetModulesResponse, Error> = await getModulesPromise;
        if (getModulesResult.isErr()) {
            return err(getModulesResult.error);
        }

        const getModulesResponse = getModulesResult.value;
        return ok(getModulesResponse)
    }

    public async executeModule(executeModuleArgs: ExecuteModuleArgs): Promise<Result<ExecuteModuleResponse, Error>> {
        const executeModulePromise: Promise<Result<ExecuteModuleResponse, Error>> = new Promise((resolve, _unusedReject) => {
            this.client.executeModule(executeModuleArgs, (error: ServiceError | null, response?: ExecuteModuleResponse) => {
                if (error === null) {
                    if (!response) {
                        resolve(err(new Error("No error was encountered but the response was still falsy; this should never happen")));
                    } else {
                        resolve(ok(response!));
                    }
                } else {
                    resolve(err(error));
                }
            })
        });
        const executeModuleResult: Result<ExecuteModuleResponse, Error> = await executeModulePromise;
        if (executeModuleResult.isErr()) {
            return err(executeModuleResult.error);
        }

        const executeModuleResponse: ExecuteModuleResponse = executeModuleResult.value;
        return ok(executeModuleResponse);
    }

    public async execCommand(execCommandArgs: ExecCommandArgs): Promise<Result<ExecCommandResponse, Error>> {
        const execCommandPromise: Promise<Result<ExecCommandResponse, Error>> = new Promise((resolve, _unusedReject) => {
            this.client.execCommand(execCommandArgs, (error: ServiceError | null, response?: ExecCommandResponse) => {
                if (error === null) {
                    if (!response) {
                        resolve(err(new Error("No error was encountered but the response was still falsy; this should never happen")));
                    } else {
                        resolve(ok(response!));
                    }
                } else {
                    resolve(err(error));
                }
            })
        });
        const execCommandResponseResult: Result<ExecCommandResponse, Error> = await execCommandPromise;
        if(execCommandResponseResult.isErr()){
            return err(execCommandResponseResult.error)
        }

        const execCommandResponse = execCommandResponseResult.value;
        return ok(execCommandResponse)
    }

    public async pauseService(pauseServiceArgs: PauseServiceArgs): Promise<Result<null, Error>> {
        const pauseServicePromise: Promise<Result<null, Error>> = new Promise((resolve, _unusedReject) => {
            this.client.pauseService(pauseServiceArgs, (error: ServiceError | null) => {
                if (error === null) {
                    resolve(ok(null))
                } else {
                    resolve(err(error));
                }
            })
        });
        const pauseServiceResult: Result<null, Error> = await pauseServicePromise;
        if(pauseServiceResult.isErr()){
            return err(pauseServiceResult.error)
        }

        return ok(null)
    }

    public async unpauseService(unpauseServiceArgs: UnpauseServiceArgs): Promise<Result<null, Error>> {
        const unpauseServicePromise: Promise<Result<null, Error>> = new Promise((resolve, _unusedReject) => {
            this.client.unpauseService(unpauseServiceArgs, (error: ServiceError | null) => {
                if (error === null) {
                    resolve(ok(null))
                } else {
                    resolve(err(error));
                }
            })
        });
        const unpauseServiceResult: Result<null, Error> = await unpauseServicePromise;
        if(unpauseServiceResult.isErr()){
            return err(unpauseServiceResult.error)
        }

        return ok(null)
    }

    public async uploadFiles(uploadFilesArtifactArgs: UploadFilesArtifactArgs): Promise<Result<UploadFilesArtifactResponse, Error>> {
        const uploadFilesArtifactPromise: Promise<Result<UploadFilesArtifactResponse, Error>> = new Promise((resolve, _unusedReject) => {
            this.client.uploadFilesArtifact(uploadFilesArtifactArgs, (error: ServiceError | null, response?: UploadFilesArtifactResponse) => {
                if (error === null) {
                    if (!response) {
                        resolve(err(new Error("No error was encountered but the response was still falsy; this should never happen")));
                    } else {
                        resolve(ok(response!));
                    }
                } else {
                    resolve(err(error));
                }
            })
        });
        const uploadFilesArtifactResponseResult: Result<UploadFilesArtifactResponse, Error> = await uploadFilesArtifactPromise;
        if(uploadFilesArtifactResponseResult.isErr()){
            return err(uploadFilesArtifactResponseResult.error)
        }

        const uploadFilesArtifactResponse = uploadFilesArtifactResponseResult.value
        return ok(uploadFilesArtifactResponse)
    }

    public async storeWebFilesArtifact(storeWebFilesArtifactArgs: StoreWebFilesArtifactArgs): Promise<Result<StoreWebFilesArtifactResponse, Error>> {
        const storeWebFilesArtifactPromise: Promise<Result<StoreWebFilesArtifactResponse, Error>> = new Promise((resolve, _unusedReject) => {
            this.client.storeWebFilesArtifact(storeWebFilesArtifactArgs, (error: ServiceError | null, response?: StoreWebFilesArtifactResponse) => {
                if (error === null) {
                    if (!response) {
                        resolve(err(new Error("No error was encountered but the response was still falsy; this should never happen")));
                    } else {
                        resolve(ok(response!));
                    }
                } else {
                    resolve(err(error));
                }
            })
        });

        const storeWebFilesArtifactResponseResult: Result<StoreWebFilesArtifactResponse, Error> = await storeWebFilesArtifactPromise;
        if(storeWebFilesArtifactResponseResult.isErr()){
            return err(storeWebFilesArtifactResponseResult.error)
        }

        const storeWebFilesArtifactResponse = storeWebFilesArtifactResponseResult.value;
        return ok(storeWebFilesArtifactResponse)
    }

    public async storeFilesArtifactFromService(storeFilesArtifactFromServiceArgs: StoreFilesArtifactFromServiceArgs): Promise<Result<StoreWebFilesArtifactResponse, Error>> {
        const storeFilesArtifactFromServicePromise: Promise<Result<StoreFilesArtifactFromServiceResponse, Error>> = new Promise( (resolve, _unusedReject) => {
            this.client.storeFilesArtifactFromService(storeFilesArtifactFromServiceArgs, {}, (error: ServiceError | null, response?: StoreFilesArtifactFromServiceResponse) => {
                if (error === null) {
                    if (!response) {
                        resolve(err(new Error("No error was encountered but the response was still falsy; this should never happen")));
                    } else {
                        resolve(ok(response!));
                    }
                } else {
                    resolve(err(error));
                }
            })
        });
        const storeFilesArtifactFromServiceResponseResult: Result<StoreFilesArtifactFromServiceResponse, Error> = await storeFilesArtifactFromServicePromise;
        if (storeFilesArtifactFromServiceResponseResult.isErr()) {
            return err(storeFilesArtifactFromServiceResponseResult.error)
        }
        const storeFilesArtifactFromServiceResponse = storeFilesArtifactFromServiceResponseResult.value;
        return ok(storeFilesArtifactFromServiceResponse);
    }

    public async renderTemplatesToFilesArtifact(renderTemplatesToFilesArtifactArgs: RenderTemplatesToFilesArtifactArgs): Promise<Result<RenderTemplatesToFilesArtifactResponse, Error>> {
        const renderTemplatesToFilesArtifactPromise: Promise<Result<RenderTemplatesToFilesArtifactResponse, Error>> = new Promise( (resolve, _unusedReject) => {
            this.client.renderTemplatesToFilesArtifact(renderTemplatesToFilesArtifactArgs, {}, (error: ServiceError | null, response?: RenderTemplatesToFilesArtifactResponse) => {
                if (error === null) {
                    if (!response) {
                        resolve(err(new Error("No error was encountered but the response was still falsy; this should never happen")));
                    } else {
                        resolve(ok(response!));
                    }
                } else {
                    resolve(err(error));
                }
            })
        });
        const renderTemplatesToFilesArtifactResponseResult: Result<RenderTemplatesToFilesArtifactResponse, Error> = await renderTemplatesToFilesArtifactPromise;
        if (renderTemplatesToFilesArtifactResponseResult.isErr()) {
            return err(renderTemplatesToFilesArtifactResponseResult.error)
        }
        const renderTemplatesToFilesArtifactResponse = renderTemplatesToFilesArtifactResponseResult.value;
        return ok(renderTemplatesToFilesArtifactResponse);
    }
}