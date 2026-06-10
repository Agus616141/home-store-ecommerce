import type { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import * as usersService from "./users.service.js";
import type {
  UpdateProfileDto,
  ChangePasswordDto,
  CreateAddressDto,
  UpdateAddressDto,
  AdminListUsersQueryDto,
  AdminUpdateUserDto,
} from "./users.schema.js";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.getProfile(req.user!.id);
  res.json({ status: "success", data: { user } });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.updateProfile(req.user!.id, req.body as UpdateProfileDto);
  res.json({ status: "success", data: { user } });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await usersService.changePassword(req.user!.id, req.body as ChangePasswordDto);
  res.json({ status: "success", data: null });
});

export const listAddresses = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await usersService.listAddresses(req.user!.id);
  res.json({ status: "success", data: { addresses } });
});

export const createAddress = asyncHandler(async (req: Request, res: Response) => {
  const address = await usersService.createAddress(req.user!.id, req.body as CreateAddressDto);
  res.status(201).json({ status: "success", data: { address } });
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const address = await usersService.updateAddress(
    req.user!.id,
    req.params["id"] as string,
    req.body as UpdateAddressDto,
  );
  res.json({ status: "success", data: { address } });
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  await usersService.deleteAddress(req.user!.id, req.params["id"] as string);
  res.status(204).send();
});

export const setDefaultAddress = asyncHandler(async (req: Request, res: Response) => {
  const address = await usersService.setDefaultAddress(req.user!.id, req.params["id"] as string);
  res.json({ status: "success", data: { address } });
});

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminListUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await usersService.adminListUsers(req.query as unknown as AdminListUsersQueryDto);
  res.json({ status: "success", data: result });
});

export const adminGetUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.adminGetUser(req.params["id"] as string);
  res.json({ status: "success", data: { user } });
});

export const adminUpdateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.adminUpdateUser(
    req.params["id"] as string,
    req.body as AdminUpdateUserDto,
  );
  res.json({ status: "success", data: { user } });
});
