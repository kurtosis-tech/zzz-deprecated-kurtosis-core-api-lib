/*
 * Copyright (c) 2020 - present Kurtosis Technologies LLC.
 * All Rights Reserved.
 */

import {ok, err, Result, Err} from "neverthrow";
import log from "loglevel";
import { isNode as  isExecutionEnvNode} from "browser-or-node";
import * as jspb from "google-protobuf";
import type {
    PartitionConnectionInfo,
    PartitionServices,
    Port,
    RemoveServiceArgs,
    RepartitionArgs,
    ServiceConfig,
    PartitionConnections,
    LoadModuleArgs,
    UnloadModuleArgs,
    GetModulesArgs,
    GetServicesArgs,
    WaitForHttpGetEndpointAvailabilityArgs,
    WaitForHttpPostEndpointAvailabilityArgs,
} from "../../kurtosis_core_rpc_api_bindings/api_container_service_pb";
import { GrpcNodeApiContainerClient } from "./grpc_node_api_container_client";
import { GrpcWebApiContainerClient } from "./grpc_web_api_container_client";
import type { GenericApiContainerClient } from "./generic_api_container_client";
import { ModuleContext, ModuleID } from "../modules/module_context";
import {
    newGetModulesArgs,
    newGetServicesArgs,
    newLoadModuleArgs,
    newPartitionConnections,
    newPartitionServices,
    newPort,
    newRemoveServiceArgs,
    newRepartitionArgs,
    newServiceConfig,
    newStartServicesArgs,
    newStoreWebFilesArtifactArgs,
    newStoreFilesArtifactFromServiceArgs,
    newUnloadModuleArgs,
    newWaitForHttpGetEndpointAvailabilityArgs,
    newWaitForHttpPostEndpointAvailabilityArgs,
    newUploadFilesArtifactArgs,
    newPauseServiceArgs,
    newUnpauseServiceArgs,
    newTemplateAndData,
    newRenderTemplatesToFilesArtifactArgs,
} from "../constructor_calls";
import type { ContainerConfig, FilesArtifactUUID } from "../services/container_config";
import type { ServiceID } from "../services/service";
import { ServiceContext } from "../services/service_context";
import { PortProtocol, PortSpec } from "../services/port_spec";
import type { GenericPathJoiner } from "./generic_path_joiner";
import type { PartitionConnection } from "./partition_connection";
import {GenericTgzArchiver} from "./generic_tgz_archiver";
import {
    ModuleInfo,
    PauseServiceArgs, ServiceInfo, UnloadModuleResponse,
    UnpauseServiceArgs,
    StartServicesArgs,
} from "../../kurtosis_core_rpc_api_bindings/api_container_service_pb";
import {should} from "chai";
import {TemplateAndData} from "./template_and_data";

export type EnclaveID = string;
export type PartitionID = string;

// This will always resolve to the default partition ID (regardless of whether such a partition exists in the enclave,
//  or it was repartitioned away)
const DEFAULT_PARTITION_ID: PartitionID = "";

// Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
export class EnclaveContext {

    private readonly backend: GenericApiContainerClient
    private readonly pathJoiner: GenericPathJoiner
    private readonly genericTgzArchiver: GenericTgzArchiver

    private constructor(backend: GenericApiContainerClient, pathJoiner: GenericPathJoiner,
                        genericTgzArchiver: GenericTgzArchiver){
        this.backend = backend;
        this.pathJoiner = pathJoiner;
        this.genericTgzArchiver = genericTgzArchiver
    }

    public static async newGrpcWebEnclaveContext(
        ipAddress: string,
        apiContainerGrpcProxyPortNum: number,
        enclaveId: string,
    ): Promise<Result<EnclaveContext, Error>> {

        if(isExecutionEnvNode){
            return err(new Error("It seems you're trying to create Enclave Context from Node environment. Please consider the 'newGrpcNodeEnclaveContext()' method instead."))
        }

        let genericApiContainerClient: GenericApiContainerClient
        let genericTgzArchiver: GenericTgzArchiver
        let pathJoiner: GenericPathJoiner
        try {

            pathJoiner = await import("path-browserify")
            const apiContainerServiceWeb = await import("../../kurtosis_core_rpc_api_bindings/api_container_service_grpc_web_pb")

            const apiContainerGrpcProxyUrl: string = `${ipAddress}:${apiContainerGrpcProxyPortNum}`
            const apiContainerClient = new apiContainerServiceWeb.ApiContainerServiceClient(apiContainerGrpcProxyUrl);
            genericApiContainerClient = new GrpcWebApiContainerClient(apiContainerClient, enclaveId)

            const webFileArchiver = await import("./web_tgz_archiver")
            genericTgzArchiver = new webFileArchiver.WebTgzArchiver()
        }catch(error) {
            if (error instanceof Error) {
                return err(error);
            }
            return err(new Error(
                "An unknown exception value was thrown during creation of the API container client that wasn't an error: " + error
            ));
        }
        
        const enclaveContext = new EnclaveContext(genericApiContainerClient, pathJoiner, genericTgzArchiver);
        return ok(enclaveContext)
    }

    public static async newGrpcNodeEnclaveContext(
        ipAddress: string,
        apiContainerGrpcPortNum: number,
        enclaveId: string,
    ): Promise<Result<EnclaveContext, Error>> {

        if(!isExecutionEnvNode){
            return err(new Error("It seems you're trying to create Enclave Context from Web environment. Please consider the 'newGrpcWebEnclaveContext()' method instead."))
        }

        let genericApiContainerClient: GenericApiContainerClient
        let genericTgzArchiver: GenericTgzArchiver
        let pathJoiner: GenericPathJoiner
        //TODO Pull things that can't throw an error out of try statement.
        try {
            pathJoiner = await import( /* webpackIgnore: true */ "path")
            const grpc_node = await import( /* webpackIgnore: true */ "@grpc/grpc-js")
            const apiContainerServiceNode = await import( /* webpackIgnore: true */ "../../kurtosis_core_rpc_api_bindings/api_container_service_grpc_pb")

            const apiContainerGrpcUrl: string = `${ipAddress}:${apiContainerGrpcPortNum}`
            const apiContainerClient = new apiContainerServiceNode.ApiContainerServiceClient(apiContainerGrpcUrl, grpc_node.credentials.createInsecure());
            genericApiContainerClient = new GrpcNodeApiContainerClient(apiContainerClient, enclaveId)

            const nodeTgzArchiver = await import(/* webpackIgnore: true */ "./node_tgz_archiver")
            genericTgzArchiver = new nodeTgzArchiver.NodeTgzArchiver()
        }catch(error) {
            if (error instanceof Error) {
                return err(error);
            }
            return err(new Error(
                "An unknown exception value was thrown during creation of the API container client that wasn't an error: " + error
            ));
        }

        const enclaveContext = new EnclaveContext(genericApiContainerClient, pathJoiner, genericTgzArchiver);
        return ok(enclaveContext)
    }

    // Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
    public getEnclaveId(): EnclaveID {
        return this.backend.getEnclaveId();
    }

    // Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
    public async loadModule(moduleId: ModuleID, image: string, serializedParams: string): Promise<Result<ModuleContext, Error>> {
        const loadModuleArgs: LoadModuleArgs = newLoadModuleArgs(moduleId, image, serializedParams);

        const loadModuleResult = await this.backend.loadModule(loadModuleArgs)
        if(loadModuleResult.isErr()){
            return err(loadModuleResult.error)
        }
        
        const moduleContext:ModuleContext = new ModuleContext(this.backend, moduleId);
        return ok(moduleContext)
    }

    // Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
    public async unloadModule(moduleId: ModuleID): Promise<Result<null ,Error>> {
        const unloadModuleArgs: UnloadModuleArgs = newUnloadModuleArgs(moduleId);

        const unloadModuleResult = await this.backend.unloadModule(unloadModuleArgs)
        if(unloadModuleResult.isErr()){
            return err(unloadModuleResult.error)
        }

        // We discard the module GUID
        return ok(null)
    }

    // Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
    public async getModuleContext(moduleId: ModuleID): Promise<Result<ModuleContext, Error>> {
        const moduleMapForArgs = new Map<string, boolean>()
        moduleMapForArgs.set(moduleId, true)
        const args: GetModulesArgs = newGetModulesArgs(moduleMapForArgs);

        const getModuleInfoResult = await this.backend.getModules(args)
        if(getModuleInfoResult.isErr()){
            return err(getModuleInfoResult.error)
        }
        const resp = getModuleInfoResult.value

        if (!resp.getModuleInfoMap().has(moduleId)) {
            return err(new Error(`Module '${moduleId}' does not exist`))
        }

        const moduleCtx: ModuleContext = new ModuleContext(this.backend, moduleId);
        return ok(moduleCtx)
    }

    // Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
    public async addService(
            serviceId: ServiceID,
            containerConfig: ContainerConfig
        ): Promise<Result<ServiceContext, Error>> {
        const containerConfigs : Map<ServiceID, ContainerConfig> = new Map<ServiceID, ContainerConfig>();
        containerConfigs.set(serviceId, containerConfig)
        const resultAddServiceToPartition : Result<[Map<ServiceID, ServiceContext>, Map<ServiceID, Error>], Error> = await this.addServicesToPartition(
            containerConfigs,
            DEFAULT_PARTITION_ID,
        );
        if (resultAddServiceToPartition.isErr()) {
            return err(resultAddServiceToPartition.error);
        }
        const [successfulServices, failedService] = resultAddServiceToPartition.value
        const serviceErr : Error | undefined = failedService.get(serviceId);
        if (serviceErr != undefined) {
            return err(new Error(`An error occurred adding service '${serviceId}' to the enclave in the default partition:\n${serviceErr}`))
        }
        const serviceCtx : ServiceContext | undefined = successfulServices.get(serviceId);
        if (serviceCtx == undefined){
            return err(new Error(`An error occurred retrieving the service context of service with ID ${serviceId} from result of adding service to partition. This should not happen and is a bug in Kurtosis.`))
        }
        return ok(serviceCtx);
    }

    // Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
    public async addServices(
            containerConfigs : Map<ServiceID, ContainerConfig>
        ): Promise<Result<[Map<ServiceID, ServiceContext>, Map<ServiceID, Error>], Error>> {

        const resultAddServicesToPartition : Result<[Map<ServiceID, ServiceContext>, Map<ServiceID, Error>], Error> = await this.addServicesToPartition(
            containerConfigs,
            DEFAULT_PARTITION_ID,
        );
        if (resultAddServicesToPartition.isErr()) {
            return err(resultAddServicesToPartition.error);
        }

        return ok(resultAddServicesToPartition.value);
    }

    // Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
    public async addServiceToPartition(
            serviceId: ServiceID,
            partitionId: PartitionID,
            containerConfig: ContainerConfig
        ): Promise<Result<ServiceContext, Error>> {
        const containerConfigs : Map<ServiceID, ContainerConfig> = new Map<ServiceID, ContainerConfig>();
        containerConfigs.set(serviceId, containerConfig)
        const resultAddServiceToPartition : Result<[Map<ServiceID, ServiceContext>, Map<ServiceID, Error>], Error> = await this.addServicesToPartition(
            containerConfigs,
            partitionId,
        );
        if (resultAddServiceToPartition.isErr()) {
            return err(resultAddServiceToPartition.error);
        }
        const [successfulServices, failedService] = resultAddServiceToPartition.value
        const serviceErr : Error | undefined = failedService.get(serviceId);
        if (serviceErr != undefined) {
            return err(new Error(`An error occurred adding service '${serviceId}' to the enclave in the default partition:\n${serviceErr}`))
        }
        const serviceCtx : ServiceContext | undefined = successfulServices.get(serviceId);
        if (serviceCtx == undefined){
            return err(new Error(`An error occurred retrieving the service context of service with ID ${serviceId} from result of adding service to partition. This should not happen and is a bug in Kurtosis.`))
        }
        return ok(serviceCtx);
    }

    // Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
    public async addServicesToPartition(
        containerConfigs: Map<ServiceID, ContainerConfig>,
        partitionID: PartitionID,
    ): Promise<Result<[Map<ServiceID, ServiceContext>, Map<ServiceID, Error>], Error>> {
        const failedServicesPool: Map<ServiceID, Error> = new Map<ServiceID, Error>();
        const successfulServices: Map<ServiceID, ServiceContext> = new Map<ServiceID, ServiceContext>();

        const serviceConfigs = new Map<ServiceID, ServiceConfig>();
        for (const [serviceID, containerConfig] of containerConfigs.entries()) {
            log.trace(`Creating files artifact ID str -> mount dirpaths map for service with Id '${serviceID}'...`);
            const artifactIdStrToMountDirpath: Map<string, string> = new Map<string, string>();
            for (const [filesArtifactId, mountDirpath] of containerConfig.filesArtifactMountpoints) {
                artifactIdStrToMountDirpath.set(filesArtifactId, mountDirpath);
            }
            log.trace(`Successfully created files artifact ID str -> mount dirpaths map for service with Id '${serviceID}'`);

            const privatePorts = containerConfig.usedPorts;
            const privatePortsForApi: Map<string, Port> = new Map();
            for (const [portId, portSpec] of privatePorts.entries()) {
                const portSpecForApi: Port = newPort(
                    portSpec.number,
                    portSpec.protocol,
                )
                privatePortsForApi.set(portId, portSpecForApi);
            }
            //TODO this is a huge hack to temporarily enable static ports for NEAR until we have a more productized solution
            const publicPorts = containerConfig.publicPorts;
            const publicPortsForApi: Map<string, Port> = new Map();
            for (const [portId, portSpec] of publicPorts.entries()) {
                const portSpecForApi: Port = newPort(
                    portSpec.number,
                    portSpec.protocol,
                )
                publicPortsForApi.set(portId, portSpecForApi);
            }
            //TODO finish the hack

            const serviceConfig: ServiceConfig = newServiceConfig(
                containerConfig.image,
                privatePortsForApi,
                publicPortsForApi,
                containerConfig.entrypointOverrideArgs,
                containerConfig.cmdOverrideArgs,
                containerConfig.environmentVariableOverrides,
                artifactIdStrToMountDirpath,
                containerConfig.cpuAllocationMillicpus,
                containerConfig.memoryAllocationMegabytes,
                containerConfig.privateIPAddrPlaceholder,
            )
            serviceConfigs.set(serviceID, serviceConfig);
        }
        log.trace("Starting new services with Kurtosis API...");
        const startServicesArgs: StartServicesArgs = newStartServicesArgs(serviceConfigs, partitionID)
        const startServicesResponseResult = await this.backend.startServices(startServicesArgs)
        if (startServicesResponseResult.isErr()) {
            return err(startServicesResponseResult.error)
        }
        const startServicesResponse = startServicesResponseResult.value;
        const successfulServicesInfo: jspb.Map<String, ServiceInfo> | undefined = startServicesResponse.getSuccessfulServiceIdsToServiceInfoMap();
        if (successfulServicesInfo === undefined) {
            return err(new Error("Expected StartServicesResponse to contain a field that does not exist."))
        }
        // defer-undo removes all successfully started services in case of errors in the future phases
        const shouldRemoveServices: Map<ServiceID, boolean> = new Map<ServiceID, boolean>();
        for (const [serviceIdStr, _] of successfulServicesInfo.entries()) {
            shouldRemoveServices.set(<ServiceID>serviceIdStr, true);
        }

        try {
            // Add services that failed to start to failed services pool
            const failedServices: jspb.Map<string, string> | undefined = startServicesResponse.getFailedServiceIdsToErrorMap();
            if (failedServices === undefined) {
                return err(new Error("Expected StartServicesResponse to contain a field that does not exist."))
            }
            for (const [serviceIdStr, serviceErrStr] of failedServices.entries()) {
                const serviceId: ServiceID = <ServiceID>serviceIdStr;
                failedServicesPool.set(serviceId, new Error(serviceErrStr))
            }
            for (const [serviceIdStr, serviceInfo] of successfulServicesInfo.entries()) {
                const serviceId: ServiceID = <ServiceID>serviceIdStr;
                const serviceCtxPrivatePorts: Map<string, PortSpec> = EnclaveContext.convertApiPortsToServiceContextPorts(
                    serviceInfo.getPrivatePortsMap(),
                );
                const serviceCtxPublicPorts: Map<string, PortSpec> = EnclaveContext.convertApiPortsToServiceContextPorts(
                    serviceInfo.getMaybePublicPortsMap(),
                );

                const serviceContext: ServiceContext = new ServiceContext(
                    this.backend,
                    serviceId,
                    serviceInfo.getPrivateIpAddr(),
                    serviceCtxPrivatePorts,
                    serviceInfo.getMaybePublicIpAddr(),
                    serviceCtxPublicPorts,
                );
                successfulServices.set(serviceId, serviceContext)
                log.trace(`Successfully started service with ID '${serviceId}' with Kurtosis API`);
            }
            // Do not remove resources for successful services
            for (const [serviceId, _] of successfulServices) {
                shouldRemoveServices.delete(serviceId)
            }
        } finally {
            for (const[serviceId, _] of shouldRemoveServices) {
                // Do a best effort attempt to remove resources for this object to clean up after it failed
                // TODO: Migrate this to a bulk remove services call
                const removeServiceArgs : RemoveServiceArgs = newRemoveServiceArgs(serviceId)
                const removeServiceResult = await this.backend.removeService(removeServiceArgs);
                if (removeServiceResult.isErr()){
                    const errMsg = `"Attempted to remove service '${serviceId}' to delete its resources after it failed to start, but the following error occurred " +
                    "while attempting to remove the service:\n ${removeServiceResult.error}`
                    failedServicesPool.set(serviceId, new Error(errMsg))
                }
            }
        }
        return ok([successfulServices, failedServicesPool])
    }

    // Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
    public async getServiceContext(serviceId: ServiceID): Promise<Result<ServiceContext, Error>> {
        const serviceArgMap = new Map<string, boolean>()
        serviceArgMap.set(serviceId, true)
        const getServiceInfoArgs: GetServicesArgs = newGetServicesArgs(serviceArgMap);

        const getServicesResult = await this.backend.getServices(getServiceInfoArgs)
        if(getServicesResult.isErr()){
            return err(getServicesResult.error)
        }

        const serviceInfo = getServicesResult.value.getServiceInfoMap().get(serviceId)
        if(!serviceInfo) {
            return err(new Error(
                    "Failed to retrieve service information for service " + serviceId
            ))
        }
        if (serviceInfo.getPrivateIpAddr() === "") {
            return err(new Error(
                    "Kurtosis API reported an empty private IP address for service " + serviceId +  " - this should never happen, and is a bug with Kurtosis!",
                )
            );
        }
        if (serviceInfo.getMaybePublicIpAddr() === "") {
            return err(new Error(
                    "Kurtosis API reported an empty public IP address for service " + serviceId +  " - this should never happen, and is a bug with Kurtosis!",
                )
            );
        }

        const serviceCtxPrivatePorts: Map<string, PortSpec> = EnclaveContext.convertApiPortsToServiceContextPorts(
            serviceInfo.getPrivatePortsMap(),
        );
        const serviceCtxPublicPorts: Map<string, PortSpec> = EnclaveContext.convertApiPortsToServiceContextPorts(
            serviceInfo.getMaybePublicPortsMap(),
        );

        const serviceContext: ServiceContext = new ServiceContext(
            this.backend,
            serviceId,
            serviceInfo.getPrivateIpAddr(),
            serviceCtxPrivatePorts,
            serviceInfo.getMaybePublicIpAddr(),
            serviceCtxPublicPorts,
        );

        return ok(serviceContext);
    }

    // Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
    public async removeService(serviceId: ServiceID): Promise<Result<null, Error>> {
        log.debug("Removing service '" + serviceId + "'...");
        const removeServiceArgs: RemoveServiceArgs = newRemoveServiceArgs(serviceId);

        const removeServiceResult = await this.backend.removeService(removeServiceArgs)
        if(removeServiceResult.isErr()){
            return err(removeServiceResult.error)
        }

        log.debug("Successfully removed service ID " + serviceId);

        return ok(null)
    }

    // Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
    public async repartitionNetwork(
            partitionServices: Map<PartitionID, Set<ServiceID>>,
            partitionConnections: Map<PartitionID, Map<PartitionID, PartitionConnection>>,
            defaultConnection: PartitionConnection
        ): Promise<Result<null, Error>> {

        if (partitionServices === null) {
            return err(new Error("Partition services map cannot be null"));
        }
        if (defaultConnection === null) {
            return err(new Error("Default connection cannot be null"));
        }

        // Cover for lazy/confused users
        if (partitionConnections === null) {
            partitionConnections = new Map();
        }

        const reqPartitionServices: Map<string, PartitionServices> = new Map();
        for (const [partitionId, serviceIdSet] of partitionServices.entries()) {
            const partitionIdStr: string = String(partitionId);
            reqPartitionServices.set(partitionIdStr, newPartitionServices(serviceIdSet));
        }

        const reqPartitionConns: Map<string, PartitionConnections> = new Map();
        for (const [partitionAId, partitionAConnsMap] of partitionConnections.entries()) {
            const partitionAConnsStrMap: Map<string, PartitionConnectionInfo> = new Map();

            for (const [partitionBId, conn] of partitionAConnsMap.entries()) {
                const partitionBIdStr: string = String(partitionBId);
                partitionAConnsStrMap.set(partitionBIdStr, conn.getPartitionConnectionInfo());
            }

            const partitionAConns: PartitionConnections = newPartitionConnections(partitionAConnsStrMap);
            const partitionAIdStr: string = String(partitionAId);
            reqPartitionConns.set(partitionAIdStr, partitionAConns);
        }

        const reqDefaultConnection = defaultConnection.getPartitionConnectionInfo()

        const repartitionArgs: RepartitionArgs = newRepartitionArgs(reqPartitionServices, reqPartitionConns, reqDefaultConnection);

        const repartitionNetworkResult = await this.backend.repartitionNetwork(repartitionArgs)
        if(repartitionNetworkResult.isErr()){
            return err(repartitionNetworkResult.error)
        }

        return ok(null)
    }

    // Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
    public async waitForHttpGetEndpointAvailability(
            serviceId: ServiceID,
            port: number,
            path: string,
            initialDelayMilliseconds: number,
            retries: number,
            retriesDelayMilliseconds: number,
            bodyText: string
        ): Promise<Result<null, Error>> {

        const availabilityArgs: WaitForHttpGetEndpointAvailabilityArgs = newWaitForHttpGetEndpointAvailabilityArgs(
            serviceId,
            port,
            path,
            initialDelayMilliseconds,
            retries,
            retriesDelayMilliseconds,
            bodyText
        );

        const waitForHttpGetEndpointAvailabilityResult = await this.backend.waitForHttpGetEndpointAvailability(availabilityArgs)
        if(waitForHttpGetEndpointAvailabilityResult.isErr()){
            return err(waitForHttpGetEndpointAvailabilityResult.error)
        }

        const result = waitForHttpGetEndpointAvailabilityResult.value
        return ok(result)
    }

    // Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
    public async waitForHttpPostEndpointAvailability(
            serviceId: ServiceID,
            port: number,
            path: string,
            requestBody: string,
            initialDelayMilliseconds: number,
            retries: number,
            retriesDelayMilliseconds: number,
            bodyText: string
        ): Promise<Result<null, Error>> {
        const availabilityArgs: WaitForHttpPostEndpointAvailabilityArgs = newWaitForHttpPostEndpointAvailabilityArgs(
            serviceId,
            port,
            path,
            requestBody,
            initialDelayMilliseconds,
            retries,
            retriesDelayMilliseconds,
            bodyText);

        return this.backend.waitForHttpPostEndpointAvailability(availabilityArgs)
    }

    // Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
    public async getServices(): Promise<Result<Set<ServiceID>, Error>> {
        const getAllServicesArgMap: Map<string, boolean> = new Map<string,boolean>()
        const emptyGetServicesArg: GetServicesArgs = newGetServicesArgs(getAllServicesArgMap)

        const getServicesResponseResult = await this.backend.getServices(emptyGetServicesArg)
        if(getServicesResponseResult.isErr()){
            return err(getServicesResponseResult.error)
        }

        const getServicesResponse = getServicesResponseResult.value

        const serviceIDs: Set<ServiceID> = new Set<ServiceID>()

        getServicesResponse.getServiceInfoMap().forEach((value: ServiceInfo, key: string) => {
            serviceIDs.add(key)
        });

        return ok(serviceIDs)
    }

    // Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
    public async getModules(): Promise<Result<Set<ModuleID>, Error>> {
        const getAllModulesArgMap: Map<string, boolean> = new Map<string,boolean>()
        const emptyGetModulesArg: GetModulesArgs = newGetModulesArgs(getAllModulesArgMap)

        const getModulesResponseResult = await this.backend.getModules(emptyGetModulesArg)
        if(getModulesResponseResult.isErr()){
            return err(getModulesResponseResult.error)
        }

        const modulesResponse = getModulesResponseResult.value

        const moduleIds: Set<ModuleID> = new Set<ModuleID>()

        modulesResponse.getModuleInfoMap().forEach((value: ModuleInfo, key: string) => {
            moduleIds.add(key)
        })

        return ok(moduleIds)
    }

    // Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
    public async uploadFiles(pathToArchive: string): Promise<Result<FilesArtifactUUID, Error>>  {
        const archiverResponse = await this.genericTgzArchiver.createTgzByteArray(pathToArchive)
        if (archiverResponse.isErr()){
            return err(archiverResponse.error)
        }

        const args = newUploadFilesArtifactArgs(archiverResponse.value)
        const uploadResult = await this.backend.uploadFiles(args)
        if (uploadResult.isErr()){
            return err(uploadResult.error)
        }

        return ok(uploadResult.value.getUuid())
    }
      
    // Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
    public async storeWebFiles(url: string): Promise<Result<FilesArtifactUUID, Error>> {
        const args = newStoreWebFilesArtifactArgs(url);
        const storeWebFilesArtifactResponseResult = await this.backend.storeWebFilesArtifact(args)
        if (storeWebFilesArtifactResponseResult.isErr()) {
            return err(storeWebFilesArtifactResponseResult.error)
        }
        const storeWebFilesArtifactResponse = storeWebFilesArtifactResponseResult.value;
        return ok(storeWebFilesArtifactResponse.getUuid())
    }

    // Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
    public async storeServiceFiles(serviceId: ServiceID, absoluteFilepathOnServiceContainer: string): Promise<Result<FilesArtifactUUID, Error>> {
        const args = newStoreFilesArtifactFromServiceArgs(serviceId, absoluteFilepathOnServiceContainer)
        const storeFilesArtifactFromServiceResponseResult = await this.backend.storeFilesArtifactFromService(args)
        if (storeFilesArtifactFromServiceResponseResult.isErr()) {
            return err(storeFilesArtifactFromServiceResponseResult.error)
        }
        const storeFilesArtifactFromServiceResponse = storeFilesArtifactFromServiceResponseResult.value;
        return ok(storeFilesArtifactFromServiceResponse.getUuid())
    }

    // Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
    public async pauseService(serviceId: string): Promise<Result<null, Error>> {
        const pauseServiceArgs: PauseServiceArgs = newPauseServiceArgs(serviceId)

        const pauseServiceResult = await this.backend.pauseService(pauseServiceArgs)
        if(pauseServiceResult.isErr()){
            return err(pauseServiceResult.error)
        }
        const pauseServiceResponse = pauseServiceResult.value
        return ok(null)
    }

    // Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
    public async unpauseService(serviceId: string): Promise<Result<null, Error>> {
        const unpauseServiceArgs: UnpauseServiceArgs = newUnpauseServiceArgs(serviceId)

        const unpauseServiceResult = await this.backend.unpauseService(unpauseServiceArgs)
        if(unpauseServiceResult.isErr()){
            return err(unpauseServiceResult.error)
        }
        const pauseServiceResponse = unpauseServiceResult.value
        return ok(null)
    }

    // Docs available at https://docs.kurtosistech.com/kurtosis-core/lib-documentation
    public async renderTemplates(templateAndDataByDestinationRelFilepath: Map<string, TemplateAndData>): Promise<Result<FilesArtifactUUID, Error>> {

        if (templateAndDataByDestinationRelFilepath.size === 0) {
            return err(new Error("Expected at least one template got 0"))
        }

        let renderTemplatesToFilesArtifactArgs = newRenderTemplatesToFilesArtifactArgs()
        let templateAndDataByRelDestinationFilepath = renderTemplatesToFilesArtifactArgs.getTemplatesAndDataByDestinationRelFilepathMap()

        for(let [destinationRelFilepath, templateAndData] of templateAndDataByDestinationRelFilepath) {

            const templateDataAsJsonString = JSON.stringify(templateAndData.templateData)
            const templateAndDataAsJson = newTemplateAndData(templateAndData.template, templateDataAsJsonString)

            templateAndDataByRelDestinationFilepath.set(destinationRelFilepath, templateAndDataAsJson)
        }

        const renderTemplatesToFilesArtifactResult = await this.backend.renderTemplatesToFilesArtifact(renderTemplatesToFilesArtifactArgs)
        if (renderTemplatesToFilesArtifactResult.isErr()) {
            return err(renderTemplatesToFilesArtifactResult.error)
        }

        return ok(renderTemplatesToFilesArtifactResult.value.getUuid())
    }
  
    // ====================================================================================================
    //                                       Private helper functions
    // ====================================================================================================
    private static convertApiPortsToServiceContextPorts(apiPorts: jspb.Map<string, Port>): Map<string, PortSpec> {
        const result: Map<string, PortSpec> = new Map();
        for (const [portId, apiPortSpec] of apiPorts.entries()) {
            const portProtocol: PortProtocol = apiPortSpec.getProtocol();
            const portNum: number = apiPortSpec.getNumber();
            result.set(portId, new PortSpec(portNum, portProtocol))
        }
        return result;
    }
}
