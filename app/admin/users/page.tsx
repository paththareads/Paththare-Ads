import RoleCheck from "../components/RoleCheck";
import AdminUsers from "./AdminUsers";

export default function UsersPage() {
  return (
    <RoleCheck allowedRoles={["SUPER_ADMIN", "ADMIN"]}>
      <AdminUsers />
    </RoleCheck>
  );
}
