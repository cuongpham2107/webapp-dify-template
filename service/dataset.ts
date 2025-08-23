import { DifyClient } from "dify-client";

import type { RequestMethods } from "dify-client";

export const routes ={
    getDatasets: {
        method: "GET" as RequestMethods,
        url: (params: {
            keyword: string,
            tag_ids: string[],
            page: number,
            limit: number,
            include_all: boolean
        }) => {
            const { keyword, tag_ids, page, limit, include_all } = params;
            return `/datasets?keyword=${keyword}&tag_ids=${tag_ids.join(",")}&page=${page}&limit=${limit}&include_all=${include_all}`;
        }
    },
    getDataset: {
        method: "GET" as RequestMethods,
        url: (datasetId: string) => `/datasets/${datasetId}`
    },
    createDataset: {
        method: "POST" as RequestMethods,
        url: () => "/datasets"
    },
    updateDataset: {
        method: "PATCH" as RequestMethods,
        url: (dataset_id: string) => `/datasets/${dataset_id}`
    },
    deleteDatasets: {
        method: "DELETE" as RequestMethods,
        url: (dataset_id: string) => `/datasets/${dataset_id}`
    },
}
export class DatasetClient extends DifyClient {
    
   getDatasets(
    keyword: string,
    tag_ids: string[],
    page: number,
    limit: number,
    include_all: boolean
   ) {
       return this.sendRequest(
            routes.getDatasets.method,
            routes.getDatasets.url({
                keyword,
                tag_ids,
                page,
                limit,
                include_all
            }),
       );
   }
   getDatasetDetail(datasetId: string) {
       return this.sendRequest(
           routes.getDataset.method,
           routes.getDataset.url(datasetId)
       );
   }
   createDataset(data: any) {
       return this.sendRequest(
           routes.createDataset.method,
           routes.createDataset.url(),
           data
       );
   }
   updateDataset(datasetId: string, data: any) {
       return this.sendRequest(
           routes.updateDataset.method,
           routes.updateDataset.url(datasetId),
           data
       );
   }
   deleteDataset(datasetId: string) {
       return this.sendRequest(
           routes.deleteDatasets.method,
           routes.deleteDatasets.url(datasetId)
       );
   }
   
}
